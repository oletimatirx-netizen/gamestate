const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const FreeFireAPI = require('@spinzaf/freefire-api');

const PORT = process.env.PORT || 8080;
const ffApi = new FreeFireAPI();
let apiReady = false;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };

// Init API
(async () => {
    try {
        await ffApi.login();
        apiReady = true;
        console.log('  FF API ready!');
    } catch (e) { console.log('  FF API init warning:', e.message); }
})();

// Simple HTTPS GET returning JSON
function httpGet(url, timeout = 20000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout }, res => {
            if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch { reject(new Error('Bad JSON')); } });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// Fetch player using npm package (works for most regions)
async function fetchViaNpm(uid) {
    if (!apiReady) await ffApi.login().then(() => apiReady = true);
    const [profile, brStats, csStats] = await Promise.all([
        ffApi.getPlayerProfile(uid),
        ffApi.getPlayerStats(uid, 'br', 'career').catch(() => null),
        ffApi.getPlayerStats(uid, 'cs', 'career').catch(() => null),
    ]);
    return { profile, brStats, csStats };
}

// Fetch player using external HTTP API (fallback, supports IND)
async function fetchViaHttp(uid, region) {
    const base = 'https://free-ff-api-src-5plp.onrender.com';
    const [account, stats] = await Promise.all([
        httpGet(`${base}/api/v1/account?region=${region}&uid=${uid}`).catch(() => null),
        httpGet(`${base}/api/v1/playerstats?region=${region}&uid=${uid}`).catch(() => null),
    ]);
    if (!account || !account.basicInfo) return null;
    // Normalize to lowercase keys to match npm format
    return {
        profile: JSON.parse(JSON.stringify(account).replace(/"([^"]+)":/g, (m, k) => `"${k.toLowerCase()}":`)),
        brStats: stats ? JSON.parse(JSON.stringify(stats).replace(/"([^"]+)":/g, (m, k) => `"${k.toLowerCase()}":`)) : null,
        csStats: null,
    };
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (url.pathname === '/api/player') {
        const uid = url.searchParams.get('uid');
        const region = url.searchParams.get('region') || 'IND';
        if (!uid) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Missing uid' })); }

        console.log(`Lookup: uid=${uid} region=${region}`);
        try {
            // Try npm package first (fast, direct)
            let data = await fetchViaNpm(uid).catch(e => {
                console.log('  NPM failed:', e.message, '- trying HTTP fallback...');
                return null;
            });

            // Fallback to HTTP API if npm fails
            if (!data || !data.profile || !data.profile.basicinfo) {
                data = await fetchViaHttp(uid, region).catch(e => {
                    console.log('  HTTP fallback also failed:', e.message);
                    return null;
                });
            }

            if (!data || !data.profile) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Player not found. The API servers may be waking up — try again in 30 seconds.' }));
            }

            console.log('  Success!');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (err) {
            console.error('  Error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Static files
    let fp = path.join(__dirname, url.pathname === '/' ? '/index.html' : url.pathname);
    if (!fp.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
    try {
        const c = fs.readFileSync(fp);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
        res.end(c);
    } catch { res.writeHead(404); res.end('Not Found'); }
});

server.listen(PORT, '0.0.0.0', () => console.log(`\n  GameStat Pro: http://localhost:${PORT}\n`));
