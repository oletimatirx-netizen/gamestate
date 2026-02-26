// ===== SVG Icon Templates =====
const ICONS = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  crosshair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  playerAvatar: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 16.5c-1.5 1.5-3 2.5-4.5 2.5-1.5 0-2.5-1-2.5-2.5 0-2 2-4 4.5-4s3.5 0 5 0 4.5 2 4.5 4c0 1.5-1 2.5-2.5 2.5s-3-1-4.5-2.5z"/><circle cx="6" cy="8" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><circle cx="18" cy="8" r="2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};

// ===== Rank Mapping =====
const RANKS = {};
for (let i = 201; i <= 220; i++) {
  const names = ['', 'Bronze I', 'Bronze II', 'Bronze III', 'Silver I', 'Silver II', 'Silver III',
    'Gold I', 'Gold II', 'Gold III', 'Gold IV', 'Platinum I', 'Platinum II', 'Platinum III', 'Platinum IV',
    'Diamond I', 'Diamond II', 'Diamond III', 'Diamond IV', 'Heroic', 'Grand Master'];
  RANKS[i] = names[i - 200] || 'Rank ' + i;
  RANKS[i + 100] = names[i - 200] || 'Rank ' + (i + 100);
}

const REGIONS = {
  'IND': 'India', 'SG': 'Singapore', 'BR': 'Brazil', 'US': 'United States',
  'ID': 'Indonesia', 'TH': 'Thailand', 'VN': 'Vietnam', 'ME': 'Middle East',
  'PK': 'Pakistan', 'BD': 'Bangladesh', 'TW': 'Taiwan', 'RU': 'Russia', 'CIS': 'CIS',
};

function formatTs(ts) {
  if (!ts) return 'N/A';
  const n = parseInt(ts);
  if (isNaN(n)) return String(ts);
  return new Date(n * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function rankName(id) { return RANKS[id] || (id ? 'Rank ' + id : 'N/A'); }
function regionName(c) { return REGIONS[c] || c || 'N/A'; }
function val(v, fallback) { return v !== undefined && v !== null && v !== '' ? v : (fallback || 'N/A'); }
function num(v) { return typeof v === 'number' ? v.toLocaleString() : val(v, '0'); }

// ===== Particles =====
function createParticles() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 8 + 6) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    const s = (Math.random() * 3 + 1.5) + 'px';
    p.style.width = s; p.style.height = s;
    p.style.opacity = Math.random() * 0.4 + 0.1;
    c.appendChild(p);
  }
}

// ===== Enter key =====
document.getElementById('playerIdInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

// ===== Search =====
async function handleSearch() {
  const gameId = document.getElementById('gameSelect').value;
  const uid = document.getElementById('playerIdInput').value.trim();

  hideResults(); hideError();

  if (!uid) return showError('Please enter a valid Player UID.');
  if (gameId !== 'freefire') return showError('This game is coming soon! Stay tuned.');

  showLoader();

  try {
    const region = document.getElementById('regionSelect').value;
    const resp = await fetch(`/api/player?uid=${uid}&region=${region}`);
    const result = await resp.json();
    hideLoader();

    if (!resp.ok || result.error) return showError(result.error || 'Failed to fetch player data.');
    if (!result.profile || !result.profile.basicinfo) return showError('Player not found. Check the UID.');

    renderResults(result);
  } catch (err) {
    hideLoader();
    showError('Connection failed. Make sure the server is running (node server.js).');
  }
}

// ===== Render =====
function renderResults(data) {
  const c = document.getElementById('resultsSection');
  c.innerHTML = '';

  const info = data.profile.basicinfo || {};
  const social = data.profile.socialinfo || {};
  const pet = data.profile.petinfo || {};
  const clan = data.profile.clanbasicinfo || {};
  const credit = data.profile.creditscoreinfo || {};

  c.innerHTML += buildHeader(info);
  c.innerHTML += card('info', ICONS.user, "Player's Account Info", accountRows(info, social));

  if (clan.clanname) c.innerHTML += card('equip', ICONS.users, 'Clan / Guild Info', clanRows(clan));
  if (pet.name || pet.id) c.innerHTML += card('pet', ICONS.paw, "Player's Pet Info", petRows(pet));

  // BR Stats
  if (data.brStats) c.innerHTML += card('battle', ICONS.crosshair, 'Battle Royale Stats', brStatsRows(data.brStats));

  // CS Stats
  if (data.csStats && data.csStats.csstats) c.innerHTML += card('battle', ICONS.crosshair, 'Clash Squad Stats', csStatsRows(data.csStats));

  if (credit.creditscore !== undefined) c.innerHTML += card('info', ICONS.shield, 'Credit Score', creditRows(credit));

  c.classList.add('active');
  setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function buildHeader(info) {
  return `
    <div class="player-header">
      <div class="player-avatar">${ICONS.playerAvatar}</div>
      <div class="player-name">${esc(val(info.nickname, 'Unknown'))}</div>
      <div class="player-uid">UID: ${esc(val(info.accountid))}</div>
      <div class="player-badges">
        <span class="badge badge-level">Level ${val(info.level, 0)}</span>
        <span class="badge badge-rank">${rankName(info.rank)}</span>
        <span class="badge badge-region">${regionName(info.region)}</span>
      </div>
    </div>`;
}

function card(type, icon, title, body) {
  return `<div class="stat-card ${type}"><div class="stat-card-header"><div class="card-icon">${icon}</div><div class="card-title">${title}</div></div><div class="stat-card-body">${body}</div></div>`;
}

function row(label, value) {
  return `<div class="stat-row"><div class="stat-check">${ICONS.check}</div><span class="stat-label">${esc(label)}:</span><span class="stat-value">${esc(String(value))}</span></div>`;
}

function accountRows(info, social) {
  return [
    row('Nickname', val(info.nickname)),
    row('Account ID', val(info.accountid)),
    row('Level', val(info.level, 0)),
    row('EXP', num(info.exp)),
    row('Likes', num(info.liked)),
    row('Region', regionName(info.region)),
    row('BR Rank', rankName(info.rank)),
    row('BR Rank Points', num(info.rankingpoints)),
    row('CS Rank', rankName(info.csrank)),
    row('CS Rank Points', val(info.csrankingpoints, '0')),
    row('Max BR Rank', rankName(info.maxrank)),
    row('Max CS Rank', rankName(info.csmaxrank)),
    row('Season', val(info.seasonid)),
    row('Badges', val(info.badgecnt, '0')),
    row('Account Created', formatTs(info.createat)),
    row('Last Login', formatTs(info.lastloginat)),
    row('Version', val(info.releaseversion)),
    row('Language', val(social.language, 'N/A').replace('Language_', '').replace('LANGUAGE', '')),
    row('Preferred Mode', val(social.modeprefer, 'N/A').replace('ModePrefer_', '').replace('MODEPREFER', '')),
    row('Bio', val(social.signature)),
  ].join('');
}

function clanRows(clan) {
  return [
    row('Clan Name', val(clan.clanname)),
    row('Clan ID', val(clan.clanid)),
    row('Clan Level', val(clan.clanlevel)),
    row('Members', `${val(clan.membernum, 0)} / ${val(clan.capacity, 30)}`),
    row('Captain ID', val(clan.captainid)),
  ].join('');
}

function petRows(pet) {
  return [
    row('Pet Name', val(pet.name)),
    row('Level', val(pet.level, 0)),
    row('EXP', num(pet.exp)),
    row('Selected', pet.isselected ? 'Yes' : 'No'),
    row('Skin ID', val(pet.skinid, 'Default')),
  ].join('');
}

function brStatsRows(brStats) {
  let html = '';
  const modes = [
    { key: 'solostats', label: 'Solo' },
    { key: 'duostats', label: 'Duo' },
    { key: 'quadstats', label: 'Squad' },
  ];
  for (const m of modes) {
    const s = brStats[m.key];
    if (s && s.gamesplayed) {
      html += `<div class="stat-section-title">${m.label}</div>`;
      html += modeRows(s);
    }
  }
  if (!html) {
    // Try flat format
    if (brStats.gamesplayed) {
      html = modeRows(brStats);
    } else {
      html = row('Status', 'No BR stats available');
    }
  }
  return html;
}

function csStatsRows(csData) {
  const s = csData.csstats || csData;
  if (!s.gamesplayed) return row('Status', 'No CS stats available');
  return [
    row('Matches Played', num(s.gamesplayed)),
    row('Wins', num(s.wins)),
    row('Win Rate', s.gamesplayed ? ((s.wins / s.gamesplayed) * 100).toFixed(1) + '%' : '0%'),
    row('Kills', num(s.kills)),
  ].join('');
}

function modeRows(s) {
  const d = s.detailedstats || {};
  const wr = s.gamesplayed ? ((s.wins / s.gamesplayed) * 100).toFixed(1) + '%' : '0%';
  const kd = d.deaths ? (s.kills / d.deaths).toFixed(2) : String(s.kills || 0);
  let rows = [
    row('Matches', num(s.gamesplayed)),
    row('Wins', num(s.wins)),
    row('Win Rate', wr),
    row('Kills', num(s.kills)),
    row('Deaths', num(d.deaths)),
    row('K/D Ratio', kd),
    row('Headshots', num(d.headshots)),
    row('Headshot Kills', num(d.headshotkills)),
    row('Highest Kills', val(d.highestkills, '0')),
    row('Damage', num(d.damage)),
  ];
  if (d.revives) rows.push(row('Revives', num(d.revives)));
  if (d.roadkills) rows.push(row('Road Kills', num(d.roadkills)));
  return rows.join('');
}

function creditRows(credit) {
  return [
    row('Credit Score', val(credit.creditscore)),
    row('Likes This Period', val(credit.periodicsummarylikecnt, '0')),
    row('Violations', val(credit.periodicsummaryillegalcnt, '0')),
  ].join('');
}

// ===== UI Helpers =====
function showLoader() { document.getElementById('loader').classList.add('active'); }
function hideLoader() { document.getElementById('loader').classList.remove('active'); }
function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorContainer').classList.add('active');
}
function hideError() { document.getElementById('errorContainer').classList.remove('active'); }
function hideResults() { document.getElementById('resultsSection').classList.remove('active'); }
function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => createParticles());
