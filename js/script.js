const API_URL = "https://script.google.com/macros/s/AKfycbx-eCuxFNWP3mQbrQZuxwKCvU9YFoS2YMdkNPedDm8W2GbdVN3WR-gsiczSlRW0ZmXh/exec";
const DEBUG = new URLSearchParams(location.search).has("debug");
const debugLines = [];
function dbg(line, isOk) {
if (!DEBUG) return;
debugLines.push(isOk === true ? `<span class="ok">✓ ${line}</span>`
: isOk === false ? `<span class="fail">✗ ${line}</span>`
: line);
const panel = document.getElementById("debugPanel");
if (panel) {
panel.classList.add("visible");
panel.innerHTML = debugLines.join("\n");
}
console.log("[MUSICon]", line);
}
if (window.Telegram?.WebApp) {
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
try {
tg.setHeaderColor("#08080a");
tg.setBackgroundColor("#08080a");
} catch (e) {}
}
const haptic = (style = "light") => {
try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style); } catch (e) {}
};
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function getScoreColor(val) {
const n = Math.round(Number(val) || 0);
if (n >= 900) return "#00b7c4";
if (n >= 800) return "#8B75D7";
if (n >= 650) return "#399B65";
if (n >= 400) return "#B85B25";
return "#C8323E";
}
const navStack = [];
let historyInited = false;
let isPopping = false;
function initHistoryOnce() {
if (historyInited) return;
historyInited = true;
try { history.replaceState({ root: true }, ''); } catch (e) {}
}
function pushNav(entry) {
initHistoryOnce();
navStack.push(entry);
try { history.pushState({ stack: navStack.map(e => ({...e})) }, ''); } catch (e) {}
renderTopOverlay();
updateTelegramBackButton();
}
function popNav() {
if (navStack.length === 0) return false;
applyPopFromHistory(navStack.slice(0, -1));
return true;
}
function applyPopFromHistory(targetStack) {
if (navStack.length === 0) {
navStack.length = 0;
navStack.push(...targetStack);
renderTopOverlay();
updateTelegramBackButton();
return;
}
const artistEl = document.getElementById('artistView');
const releaseEl = document.getElementById('releaseView');
let topEl = null;
const aOpen = artistEl.classList.contains('open');
const rOpen = releaseEl.classList.contains('open');
if (aOpen && rOpen) {
const az = parseInt(artistEl.style.zIndex) || 100;
const rz = parseInt(releaseEl.style.zIndex) || 110;
topEl = az > rz ? artistEl : releaseEl;
} else if (aOpen) topEl = artistEl;
else if (rOpen) topEl = releaseEl;
let snapshot = null;
if (topEl) {
snapshot = topEl.cloneNode(true);
snapshot.removeAttribute('id');
snapshot.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
Object.assign(snapshot.style, {
position: 'fixed', inset: '0', zIndex: '9999',
pointerEvents: 'none', margin: '0',
transition: 'none', transform: 'translateY(0)', opacity: '1'
});
const origScroll = topEl.querySelector('.artist-view-scroll, .release-view-scroll');
const cloneScroll = snapshot.querySelector('.artist-view-scroll, .release-view-scroll');
if (origScroll && cloneScroll) cloneScroll.scrollTop = origScroll.scrollTop;
document.body.appendChild(snapshot);
}
navStack.length = 0;
navStack.push(...targetStack);
isPopping = true;
try {
renderTopOverlay();
} finally {
isPopping = false;
}
if (snapshot) {
void snapshot.offsetWidth;
snapshot.style.transition = 'transform .3s cubic-bezier(.32,.72,0,1), opacity .3s';
snapshot.style.transform = 'translateY(100%)';
snapshot.style.opacity = '0';
setTimeout(() => snapshot.remove(), 320);
}
updateTelegramBackButton();
}
function goBack() {
if (navStack.length > 0) {
try { history.back(); } catch (e) { popNav(); }
}
}
function updateTelegramBackButton() {
const tg = window.Telegram?.WebApp;
if (!tg?.BackButton) return;
try {
if (navStack.length > 0) tg.BackButton.show();
else tg.BackButton.hide();
} catch (e) {}
}
window.addEventListener('popstate', (e) => {
const state = e.state;
if (!state || !Array.isArray(state.stack)) {
if (navStack.length > 0) popNav();
return;
}
const targetStack = state.stack;
if (targetStack.length < navStack.length) {
applyPopFromHistory(targetStack);
} else if (targetStack.length > navStack.length) {
navStack.length = 0;
navStack.push(...targetStack);
renderTopOverlay();
updateTelegramBackButton();
}
});
if (window.Telegram?.WebApp?.BackButton) {
try {
window.Telegram.WebApp.BackButton.onClick(() => goBack());
} catch (e) {}
}
function renderTopOverlay() {
const artistEl = document.getElementById('artistView');
const releaseEl = document.getElementById('releaseView');
const legendEl = document.getElementById('legendModal');
const catalogEl = document.getElementById('catalogView');
const paramsEl = document.getElementById('catalogParamsView');
const oscoreEl = document.getElementById('oscoreModal');
if (navStack.length === 0) {
document.body.classList.remove('locked');
document.title = 'MUSICon';
if (artistEl) { artistEl.classList.remove('open'); artistEl.setAttribute('aria-hidden', 'true'); }
if (releaseEl) { releaseEl.classList.remove('open'); releaseEl.setAttribute('aria-hidden', 'true'); }
if (catalogEl) { catalogEl.classList.remove('open'); catalogEl.setAttribute('aria-hidden', 'true'); }
if (paramsEl) { paramsEl.classList.remove('open'); paramsEl.setAttribute('aria-hidden', 'true'); }
if (legendEl) { legendEl.classList.remove('open'); legendEl.setAttribute('aria-hidden', 'true'); }
if (oscoreEl) { oscoreEl.classList.remove('open'); oscoreEl.setAttribute('aria-hidden', 'true'); }
return;
}
document.body.classList.add('locked');
let artistEntry = null;
let releaseEntry = null;
let hasCatalog = false;
let hasParams = false;
let hasLegend = false;
let hasOscore = false;
for (const e of navStack) {
if (e.type === 'catalog') hasCatalog = true;
if (e.type === 'catalog-params') { hasCatalog = true; hasParams = true; }
if (e.type === 'artist') artistEntry = e;
if (e.type === 'release') releaseEntry = e;
if (e.type === 'legend') hasLegend = true;
if (e.type === 'oscore') hasOscore = true;
}
if (catalogEl) {
if (hasCatalog) {
if (!catalogEl.classList.contains('open')) {
catalogEl.classList.add('open');
catalogEl.setAttribute('aria-hidden', 'false');
renderCatalog();
}
} else {
catalogEl.classList.remove('open');
catalogEl.setAttribute('aria-hidden', 'true');
}
}
if (paramsEl) {
if (hasParams) {
if (!paramsEl.classList.contains('open')) {
paramsEl.classList.add('open');
paramsEl.setAttribute('aria-hidden', 'false');
renderCatalogParams();
}
} else {
paramsEl.classList.remove('open');
paramsEl.setAttribute('aria-hidden', 'true');
}
}
if (artistEl) {
if (artistEntry) {
const lastArtistIdx  = navStack.map(e => e.type).lastIndexOf('artist');
const lastReleaseIdx = navStack.map(e => e.type).lastIndexOf('release');
const needAbove      = lastReleaseIdx !== -1 && lastArtistIdx > lastReleaseIdx;
const isOpen         = artistEl.classList.contains('open');
const wasAbove       = artistEl.style.zIndex === '120' || artistEl.style.zIndex === '120px';
if (needAbove) {
if (isOpen && !wasAbove) {
if (isPopping) {
artistEl.style.zIndex = '120';
renderArtistContent(artistEntry.name);
} else {
artistEl.style.transition = 'none';
artistEl.classList.remove('open');
artistEl.style.zIndex = '120';
artistEl.getBoundingClientRect();
artistEl.style.transition = '';
renderArtistContent(artistEntry.name);
requestAnimationFrame(() => requestAnimationFrame(() => {
artistEl.classList.add('open');
artistEl.setAttribute('aria-hidden', 'false');
}));
}
} else if (!isOpen) {
artistEl.style.zIndex = '120';
renderArtistContent(artistEntry.name);
if (isPopping) {
artistEl.classList.add('open');
artistEl.setAttribute('aria-hidden', 'false');
} else {
requestAnimationFrame(() => requestAnimationFrame(() => {
artistEl.classList.add('open');
artistEl.setAttribute('aria-hidden', 'false');
}));
}
} else {
renderArtistContent(artistEntry.name);
}
} else {
if (wasAbove && artistEntry) {
artistEl.style.zIndex = '';
renderArtistContent(artistEntry.name);
if (releaseEl && releaseEl.classList.contains('open')) {
releaseEl._needsReplay = true;
}
} else if (wasAbove) {
artistEl.classList.remove('open');
artistEl.setAttribute('aria-hidden', 'true');
setTimeout(() => {
if (!artistEl.classList.contains('open')) {
artistEl.style.zIndex = '';
}
}, 350);
} else if (!isOpen) {
artistEl.style.zIndex = '';
renderArtistContent(artistEntry.name);
requestAnimationFrame(() => requestAnimationFrame(() => {
artistEl.classList.add('open');
artistEl.setAttribute('aria-hidden', 'false');
}));
} else {
renderArtistContent(artistEntry.name);
}
}
} else {
const wasOpen = artistEl.classList.contains('open');
artistEl.classList.remove('open');
artistEl.setAttribute('aria-hidden', 'true');
if (wasOpen) {
setTimeout(() => {
if (!artistEl.classList.contains('open')) {
artistEl.style.zIndex = '';
}
}, 350);
} else {
artistEl.style.zIndex = '';
}
}
}
if (releaseEl) {
if (releaseEntry) {
const rel = allReleases.find(r => r.artist === releaseEntry.artist && r.release === releaseEntry.release);
if (rel) {
const releaseKey = releaseEntry.artist + ':::' + releaseEntry.release;
const wasOpen = releaseEl.classList.contains('open');
const contentChanged = releaseEl._renderedKey !== releaseKey;
const needsReplay = releaseEl._needsReplay === true;
releaseEl._needsReplay = false;
if (wasOpen && (contentChanged || needsReplay) && !isPopping) {
releaseEl.style.transition = 'none';
releaseEl.classList.remove('open');
releaseEl.getBoundingClientRect();
releaseEl.style.transition = '';
renderReleaseContent(rel);
releaseEl._renderedKey = releaseKey;
requestAnimationFrame(() => requestAnimationFrame(() => {
releaseEl.classList.add('open');
releaseEl.setAttribute('aria-hidden', 'false');
}));
} else {
renderReleaseContent(rel);
releaseEl._renderedKey = releaseKey;
if (!wasOpen) {
releaseEl.classList.add('open');
releaseEl.setAttribute('aria-hidden', 'false');
}
}
}
} else {
releaseEl.classList.remove('open');
releaseEl.setAttribute('aria-hidden', 'true');
releaseEl._renderedKey = '';
releaseEl._needsReplay = false;
}
}
if (legendEl) {
if (hasLegend) {
if (currentRankName) {
const modalContent = document.getElementById('legendModalContent');
if (modalContent) {
modalContent.querySelectorAll('.legend-rank').forEach(el => {
const name = el.dataset.rankName;
el.classList.toggle('current', currentRankName && name === currentRankName);
});
}
}
legendEl.classList.add('open');
legendEl.setAttribute('aria-hidden', 'false');
} else {
legendEl.classList.remove('open');
legendEl.setAttribute('aria-hidden', 'true');
}
}
if (oscoreEl) {
if (hasOscore) {
oscoreEl.classList.add('open');
oscoreEl.setAttribute('aria-hidden', 'false');
} else {
oscoreEl.classList.remove('open');
oscoreEl.setAttribute('aria-hidden', 'true');
}
}
if (hasLegend) document.title = 'Уровни артистов · MUSICon';
else if (hasOscore) document.title = 'onScore · MUSICon';
else if (releaseEntry) document.title = releaseEntry.release + ' · MUSICon';
else if (artistEntry) document.title = artistEntry.name + ' · MUSICon';
else if (hasParams) document.title = 'Параметры · MUSICon';
else if (hasCatalog) document.title = 'Все оценки · MUSICon';
}
window.addEventListener('keydown', (e) => {
if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
if (navStack.length > 0) {
e.preventDefault();
goBack();
}
}
});
function splitArtists(str) {
if (!str) return [];
return String(str).split(";").map(s => s.trim()).filter(Boolean);
}
function renderArtistLinks(artistStr) {
const list = splitArtists(artistStr);
if (!list.length) return escapeHtml(artistStr || "");
return list.map(name =>
`<span class="artist-link" data-artist="${escapeHtml(name)}">${escapeHtml(name)}</span>`
).join('<span class="artist-sep">; </span>');
}
function stringHash(str) {
let h = 0;
for (let i = 0; i < str.length; i++) {
h = ((h << 5) - h) + str.charCodeAt(i);
h |= 0;
}
return Math.abs(h);
}
function artistGradient(name) {
const hash = stringHash(name || "?");
const hue1 = (hash % 40) + 345;
const hue2 = (hue1 + 25) % 360;
return `linear-gradient(135deg, hsl(${hue1}, 72%, 46%), hsl(${hue2}, 78%, 32%))`;
}
function artistGlow(name) {
const hash = stringHash(name || "?");
const hue = (hash % 35) + 345;
return `hsla(${hue}, 75%, 48%, .45)`;
}
function escapeHtml(str) {
return String(str ?? "").replace(/[&<>"']/g, ch => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': "&quot;",
"'": "&#39;"
}[ch]));
}
function sanitizeUrl(raw) {
if (!raw) return null;
let s = String(raw).trim();
if (!s) return null;
if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(s)) {
s = "https://" + s;
}
try {
const u = new URL(s);
if (u.protocol === "http:" || u.protocol === "https:") return u.href;
return null;
} catch (e) {
if (/^https?:\/\//i.test(s)) return s;
return null;
}
}
function plural(n, one, few, many) {
const m10 = n % 10, m100 = n % 100;
if (m10 === 1 && m100 !== 11) return one;
if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
return many;
}
const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();
function getTrackBadge(trackCount) {
const n = Number(trackCount) || 0;
if (n >= 60) return { emoji: "⭐", name: "Звезда" };
if (n >= 40) return { emoji: "🌕", name: "Полнолуние" };
if (n >= 25) return { emoji: "🌔", name: "Растущая луна" };
if (n >= 15) return { emoji: "🌓", name: "Первая четверть" };
if (n >= 5)  return { emoji: "🌒", name: "Молодая луна" };
return { emoji: "🌑", name: "Новолуние" };
}
function getLegendItems() {
return [
{ emoji: "🌑", name: "Новолуние", desc: "Мы только начали знакомство с артистом. Оценка основана на малом количестве треков, поэтому итоговый балл пока предварительный и может сильно измениться после новых релизов." },
{ emoji: "🌒", name: "Молодая луна", desc: "Уже есть первое представление о стиле и качестве. Однако выборка всё ещё небольшая, и один новый удачный или провальный трек способен заметно повлиять на рейтинг." },
{ emoji: "🌓", name: "Первая четверть", desc: "Оценка начинает стабилизироваться. Мы послушали достаточно треков, чтобы составить объективное мнение, но потенциал для изменения всё еще есть." },
{ emoji: "🌔", name: "Растущая луна", desc: "Картина почти ясна. У нас солидная выборка, и случайные треки уже не играют большой роли. Оценка хорошо отражает реальный уровень артиста по нашей шкале." },
{ emoji: "🌕", name: "Полнолуние", desc: "Мы видим артиста целиком. Оценка проверена большим количеством прослушанного материала. Повлиять на этот балл случайным синглом или филлером уже невозможно." },
{ emoji: "⭐", name: "Звезда", desc: "Максимальная степень изученности. Мы знаем творчество этого артиста вдоль и поперек. Оценка железобетонная, максимально точная и не подлежит сомнению." }
];
}
function renderLegendItemsHTML() {
return getLegendItems().map(item => `
<div class="legend-rank" data-rank-name="${escapeHtml(item.name)}">
<div class="legend-rank-header">
<span class="legend-rank-emoji">${item.emoji}</span>
<span class="legend-rank-name">${item.name}</span>
</div>
<p class="legend-rank-desc">${escapeHtml(item.desc)}</p>
</div>
`).join("");
}
function renderLegend() {
const card = $("#legendCard");
const modal = $("#legendModalContent");
const html = renderLegendItemsHTML();
if (card) card.innerHTML = html;
if (modal) modal.innerHTML = html;
}
function formatDateRu(isoDate) {
if (!isoDate) return "";
const s = String(isoDate).trim();
if (!s) return "";
const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (m) {
const y = m[1], mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${d} ${months[mo - 1]} ${y}`;
}
m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
if (m) {
const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = m[3];
if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${d} ${months[mo - 1]} ${y}`;
}
const dt = new Date(s);
if (!isNaN(dt.getTime())) return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
return s;
}
function clean(s) {
return String(s || "").toLowerCase()
.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ")
.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
.replace(/\s+/g, " ").trim();
}
function coverHTML({ artist, album, explicitUrl, sizeClass = "small" }) {
const init = escapeHtml(initial(artist));
const bg   = artistGradient(artist);
if (explicitUrl) {
return `<div class="cover ${sizeClass}" style="background:${bg}"><span class="cover-initial">${init}</span><img src="${escapeHtml(explicitUrl)}" alt="" loading="lazy" onload="this.previousElementSibling.style.display='none'" onerror="this.remove()"></div>`;
}
return `<div class="cover ${sizeClass}" style="background:${bg}"><span class="cover-initial">${init}</span></div>`;
}
let allReleases = [];
let globalArtistImages = {};
let globalArtistLinks = {};
let currentRankName = null;
const artistMap = new Map();
function buildArtistMap() {
artistMap.clear();
for (const r of allReleases) {
const artists = splitArtists(r.artist);
if (!artists.length && r.artist) artists.push(r.artist);
for (const name of artists) {
if (!artistMap.has(name)) {
const img = globalArtistImages[name] || globalArtistImages[name.trim()] || "";
const explicitLinks = globalArtistLinks[name] || globalArtistLinks[name.trim()] || {};
artistMap.set(name, {
name, releases: [],
imageUrl: typeof img === "string" ? img : (img.imageUrl || ""),
yandex_url: explicitLinks.yandex_url || "",
spotify_url: explicitLinks.spotify_url || ""
});
}
const entry = artistMap.get(name);
if (!entry.releases.includes(r)) entry.releases.push(r);
}
// Добавляем фичеров в карту
const tracks = Array.isArray(r.tracks) ? r.tracks : [];
for (const t of tracks) {
const featList = t.feat ? t.feat.split(";").map(s => s.trim()).filter(Boolean) : [];
for (const featName of featList) {
if (!artistMap.has(featName)) {
const img = globalArtistImages[featName] || globalArtistImages[featName.trim()] || "";
const explicitLinks = globalArtistLinks[featName] || globalArtistLinks[featName.trim()] || {};
artistMap.set(featName, {
name: featName, releases: [],
imageUrl: typeof img === "string" ? img : (img.imageUrl || ""),
yandex_url: explicitLinks.yandex_url || "",
spotify_url: explicitLinks.spotify_url || ""
});
}
}
}
}
for (const entry of artistMap.values()) {
entry.releases.sort((a, b) => b.avg1000 - a.avg1000);
if (!entry.yandex_url) {
for (const r of entry.releases) {
if (r.artist_url_yandex) { entry.yandex_url = r.artist_url_yandex; break; }
}
}
if (!entry.spotify_url) {
for (const r of entry.releases) {
if (r.artist_url_spotify) { entry.spotify_url = r.artist_url_spotify; break; }
}
}
}
}
function calculateArtistStats(entry) {
  const artistName = entry.name;
  const allTracks = [];
  const seenKeys = new Set();
  const involvedReleases = new Set(); // Релизы, где артист основной или на фите

  for (const r of allReleases) {
    const tracks = Array.isArray(r.tracks) ? r.tracks : [];
    const mainArtists = splitArtists(r.artist);
    const isMainArtist = mainArtists.includes(artistName);

    if (isMainArtist) {
      involvedReleases.add(r);
    }

    for (const t of tracks) {
      const featList = t.feat ? t.feat.split(";").map(s => s.trim()).filter(Boolean) : [];
      const isFeat = featList.includes(artistName);

      if (!isMainArtist && !isFeat) continue;

      if (isFeat) {
        involvedReleases.add(r);
      }

      if (t.track_key && seenKeys.has(t.track_key)) continue;
      if (t.track_key) seenKeys.add(t.track_key);

      const weight = isMainArtist ? 1.0 : 0.6;
      const score = Number(t.avg1000) || 0;
      if (score === 0) continue;

      allTracks.push({
        rawScore: score,
        weightedScore: score * weight,
        weight: weight
      });
    }
  }

  let weightedTotal = 0;
  let weightedCount = 0;
  for (const t of allTracks) {
    weightedTotal += t.weightedScore;
    weightedCount += t.weight;
  }

  const rawAvg = weightedCount > 0 ? (weightedTotal / weightedCount) : 0;

  // Лучший результат: максимум среди его релизов (или среди треков с фитами, если своих релизов нет)
  let bestScore = 0;
  if (entry.releases.length > 0) {
    bestScore = Math.max(...entry.releases.map(r => Number(r.avg1000) || 0));
  } else if (allTracks.length > 0) {
    bestScore = Math.max(...allTracks.map(t => t.rawScore));
  }

  const GLOBAL_AVERAGE = 600;
  let weightedAvg = null;

  if (weightedCount >= 5) {
    if (weightedCount < 20) {
      const virtualWeight = 20 - weightedCount;
      weightedAvg = (weightedTotal + (GLOBAL_AVERAGE * virtualWeight)) / 20;
    } else {
      weightedAvg = weightedTotal / weightedCount;
    }
  }

  return {
    count: involvedReleases.size,      // Считает и свои релизы, и релизы с фитами
    totalTracks: allTracks.length,     // Каждый фит считается за 1 полноценный трек
    rawAvg,
    weightedAvg,
    bestScore
  };
}

const CATALOG_STORAGE_KEY = "musicon_catalog_v1";
const MONTH_NAMES = { "01": "Янв", "02": "Фев", "03": "Мар", "04": "Апр", "05": "Май", "06": "Июн", "07": "Июл", "08": "Авг", "09": "Сен", "10": "Окт", "11": "Ноя", "12": "Дек" };
const DEFAULT_CATALOG_STATE = { search: "", sort: "newest", types: [], years: [], months: [], scorePresets: [], customScoreMin: null, customScoreMax: null };
let catalogState = { ...DEFAULT_CATALOG_STATE };
function loadCatalogState() {
try {
const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
if (!raw) return;
const data = JSON.parse(raw);
if (typeof data !== "object" || data === null) return;
catalogState.search = typeof data.search === "string" ? data.search : "";
catalogState.sort = ["newest", "oldest", "score_desc", "score_asc"].includes(data.sort) ? data.sort : "newest";
catalogState.types = Array.isArray(data.types) ? data.types.map(String) : [];
catalogState.years = Array.isArray(data.years) ? data.years.map(String) : [];
if (Array.isArray(data.months)) {
catalogState.months = data.months.map(String);
} else if (typeof data.months === "object" && data.months !== null) {
const arr = [];
Object.values(data.months).forEach(v => { if (Array.isArray(v)) v.forEach(m => arr.push(String(m))); });
catalogState.months = [...new Set(arr)];
} else {
catalogState.months = [];
}
catalogState.scorePresets = Array.isArray(data.scorePresets) ? data.scorePresets.map(String) : [];
catalogState.customScoreMin = Number.isFinite(data.customScoreMin) ? Number(data.customScoreMin) : null;
catalogState.customScoreMax = Number.isFinite(data.customScoreMax) ? Number(data.customScoreMax) : null;
} catch (e) {
catalogState = {
search: "", sort: "newest",
types: [], years: [], months: [], scorePresets: [],
customScoreMin: null, customScoreMax: null
};
}
}
let saveStateTimer = null;
function saveCatalogStateDebounced() {
clearTimeout(saveStateTimer);
saveStateTimer = setTimeout(() => {
try { localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalogState)); } catch (e) {}
}, 300);
}
function isDefaultState() {
return (!catalogState.search.trim() && catalogState.sort === "newest" && catalogState.types.length === 0 && catalogState.years.length === 0 && catalogState.months.length === 0 && catalogState.scorePresets.length === 0 && catalogState.customScoreMin === null && catalogState.customScoreMax === null);
}
function getAvailableFilterData() {
const typesSet = new Set();
const yearMonthMap = {};
for (const r of allReleases) {
if (r.type && String(r.type).trim()) typesSet.add(String(r.type).trim());
const d = String(r.date || "").trim();
if (d) {
let y = "", m = "";
let match = d.match(/^(\d{4})-(\d{2})/);
if (match) { y = match[1]; m = match[2]; }
else {
match = d.match(/[.\/-](\d{4})$/);
if (match) y = match[1];
const matchM = d.match(/^[.\/-]?\d{1,2}[.\/-](\d{1,2})/);
if (matchM) m = matchM[1].padStart(2, "0");
}
if (y && y.length === 4) {
if (!yearMonthMap[y]) yearMonthMap[y] = new Set();
if (m && m >= "01" && m <= "12") yearMonthMap[y].add(m);
}
}
}
const types = [...typesSet].sort((a, b) => a.localeCompare(b, "ru"));
const years = Object.keys(yearMonthMap).sort((a, b) => b.localeCompare(a));
return { types, years, yearMonthMap };
}
function getFilteredReleases() {
const rawQ = clean(catalogState.search).replace(/ё/g, "е");
const filtered = allReleases.filter(r => {
if (rawQ) {
const target = (clean(r.artist) + " " + clean(r.release)).replace(/ё/g, "е");
if (!target.includes(rawQ)) return false;
}
if (catalogState.types.length > 0) {
if (!catalogState.types.includes(String(r.type || "").trim())) return false;
}
if (catalogState.years.length > 0) {
const d = String(r.date || "").trim();
let y = "", m = "";
let match = d.match(/^(\d{4})-(\d{2})/);
if (match) { y = match[1]; m = match[2]; }
else {
match = d.match(/[.\/-](\d{4})$/);
if (match) y = match[1];
const matchM = d.match(/^[.\/-]?\d{1,2}[.\/-](\d{1,2})/);
if (matchM) m = matchM[1].padStart(2, "0");
}
if (!y || !catalogState.years.includes(y)) return false;
if (catalogState.months.length > 0) {
if (!m || !catalogState.months.includes(m)) return false;
}
}
const hasPresets = catalogState.scorePresets.length > 0;
const hasCustom = catalogState.customScoreMin !== null || catalogState.customScoreMax !== null;
if (hasPresets || hasCustom) {
const score = Math.round(Number(r.avg1000) || 0);
let matchScore = false;
if (hasPresets) {
for (const preset of catalogState.scorePresets) {
const parts = preset.split("-").map(Number);
if (parts.length === 2 && score >= parts[0] && score <= parts[1]) { matchScore = true; break; }
}
}
if (!matchScore && hasCustom) {
const min = catalogState.customScoreMin !== null ? catalogState.customScoreMin : 0;
const max = catalogState.customScoreMax !== null ? catalogState.customScoreMax : 1000;
if (score >= min && score <= max) matchScore = true;
}
if (!matchScore) return false;
}
return true;
});
const sortMode = catalogState.sort;
return filtered.sort((a, b) => {
if (sortMode === "score_desc") return (b.avg1000 - a.avg1000) || (b._row - a._row);
if (sortMode === "score_asc") return (a.avg1000 - b.avg1000) || (a._row - b._row);
if (sortMode === "oldest") {
if (a.date && b.date) {
const cmp = a.date.localeCompare(b.date);
if (cmp !== 0) return cmp;
} else if (a.date && !b.date) return -1;
else if (!a.date && b.date) return 1;
return a._row - b._row;
}
if (a.date && b.date) {
const cmp = b.date.localeCompare(a.date);
if (cmp !== 0) return cmp;
} else if (a.date && !b.date) return -1;
else if (!a.date && b.date) return 1;
return b._row - a._row;
});
}
function openCatalog() {
haptic("light");
pushNav({ type: 'catalog' });
}
function openCatalogParams() {
haptic("light");
pushNav({ type: 'catalog-params' });
}
function resetAllFilters() {
clearTimeout(searchDebounceTimer);
catalogState = {
search: "",
sort: "newest",
types: [],
years: [],
months: [],
scorePresets: [],
customScoreMin: null,
customScoreMax: null
};
const searchInput = document.getElementById("catalogSearchInput");
if (searchInput) searchInput.value = "";
const clearBtn = document.getElementById("searchClearBtn");
if (clearBtn) clearBtn.style.display = "none";
saveCatalogStateDebounced();
renderCatalog();
renderCatalogParams();
haptic("light");
}
function renderCatalog() {
const listEl = document.getElementById("catalogReleaseList");
const emptyEl = document.getElementById("catalogEmptyState");
const statusEl = document.getElementById("catalogStatus");
const statusTextEl = document.getElementById("catalogStatusText");
const badgeDot = document.getElementById("paramsBadgeDot");
const searchInput = document.getElementById("catalogSearchInput");
const clearBtn = document.getElementById("searchClearBtn");
if (!listEl) return;
if (searchInput && searchInput.value !== catalogState.search) searchInput.value = catalogState.search;
if (clearBtn) clearBtn.style.display = catalogState.search.trim() ? "flex" : "none";
const filtered = getFilteredReleases();
const isDefault = isDefaultState();
if (badgeDot) {
const hasActiveFiltersOrSort = (catalogState.sort !== "newest" || catalogState.types.length > 0 || catalogState.years.length > 0 || catalogState.months.length > 0 || catalogState.scorePresets.length > 0 || catalogState.customScoreMin !== null || catalogState.customScoreMax !== null);
badgeDot.style.display = hasActiveFiltersOrSort ? "block" : "none";
}
if (statusEl) {
if (!isDefault) {
statusEl.style.display = "flex";
if (statusTextEl) statusTextEl.textContent = `Найдено ${filtered.length} из ${allReleases.length}`;
} else {
statusEl.style.display = "none";
}
}
if (filtered.length === 0) {
listEl.innerHTML = "";
if (emptyEl) emptyEl.style.display = "flex";
return;
}
if (emptyEl) emptyEl.style.display = "none";
listEl.innerHTML = filtered.map(r => {
const trackLabel = r.track_count ? ` · ${r.track_count} ${plural(r.track_count, "трек", "трека", "треков")}` : "";
const dateLabel = r.date ? " · " + formatDateRu(r.date) : "";
const scoreVal = Math.round(r.avg1000);
const scoreCol = getScoreColor(scoreVal);
return `
<li class="release-item" data-release-artist="${escapeHtml(r.artist)}" data-release-name="${escapeHtml(r.release)}">
${coverHTML({ artist: r.artist, album: r.release, explicitUrl: r.cover_url, sizeClass: "medium" })}
<div class="item-info">
<div class="item-title">${escapeHtml(r.release)}</div>
<div class="item-artist">${renderArtistLinks(r.artist)} · ${escapeHtml(r.type || "")}${trackLabel}${dateLabel}</div>
</div>
<div class="item-score" style="color:${scoreCol};">${scoreVal}</div>
</li>
`}).join("");
}
function renderCatalogParams() {
const liveCounter = document.getElementById("paramsLiveCounter");
const typeChipsEl = document.getElementById("paramTypeChips");
const yearChipsEl = document.getElementById("paramYearChips");
const monthContainer = document.getElementById("paramMonthContainer");
const monthChipsEl = document.getElementById("paramMonthChips");
const customMinInput = document.getElementById("customScoreMin");
const customMaxInput = document.getElementById("customScoreMax");
const rangeClearBtn = document.getElementById("customRangeClearBtn");
const filtered = getFilteredReleases();
if (liveCounter) liveCounter.textContent = `Найдено ${filtered.length} ${plural(filtered.length, "релиз", "релиза", "релизов")}`;
document.querySelectorAll('input[name="catalogSort"]').forEach(radio => { radio.checked = (radio.value === catalogState.sort); });
const { types, years, yearMonthMap } = getAvailableFilterData();
if (typeChipsEl) {
typeChipsEl.innerHTML = types.map(t => {
const active = catalogState.types.includes(t) ? "active" : "";
return `<button type="button" class="param-chip ${active}" data-type="${escapeHtml(t)}">${escapeHtml(t)}</button>`;
}).join("");
}
if (yearChipsEl) {
yearChipsEl.innerHTML = years.map(y => {
const active = catalogState.years.includes(y) ? "active" : "";
return `<button type="button" class="param-chip ${active}" data-year="${escapeHtml(y)}">${escapeHtml(y)}</button>`;
}).join("");
}
if (monthContainer && monthChipsEl) {
if (catalogState.years.length > 0) {
const availableMonths = new Set();
for (const y of catalogState.years) {
if (yearMonthMap[y]) yearMonthMap[y].forEach(m => availableMonths.add(m));
}
const sortedMonths = [...availableMonths].sort();
if (sortedMonths.length > 0) {
monthContainer.style.display = "block";
monthChipsEl.innerHTML = sortedMonths.map(m => {
const active = catalogState.months.includes(m) ? "active" : "";
return `<button type="button" class="param-chip ${active}" data-month="${m}">${MONTH_NAMES[m] || m}</button>`;
}).join("");
} else {
monthContainer.style.display = "none";
}
} else {
monthContainer.style.display = "none";
}
}
document.querySelectorAll("#paramScorePresetChips .param-chip").forEach(btn => {
btn.classList.toggle("active", catalogState.scorePresets.includes(btn.getAttribute("data-preset")));
});
if (customMinInput && document.activeElement !== customMinInput) customMinInput.value = catalogState.customScoreMin !== null ? String(catalogState.customScoreMin) : "";
if (customMaxInput && document.activeElement !== customMaxInput) customMaxInput.value = catalogState.customScoreMax !== null ? String(catalogState.customScoreMax) : "";
if (rangeClearBtn) rangeClearBtn.style.display = (catalogState.customScoreMin !== null || catalogState.customScoreMax !== null) ? "flex" : "none";
}
function renderLatest(r) {
const c = $("#latestContainer");
if (!r) { c.innerHTML = `<div class="status">Релизы не найдены</div>`; return; }
const trackLabel = r.track_count ? ` · ${r.track_count} ${plural(r.track_count, "трек", "трека", "треков")}` : "";
const dateLabel = r.date ? "оценено " + formatDateRu(r.date) : "Недавно";
const scoreVal = Math.round(r.avg1000);
const scoreCol = getScoreColor(scoreVal);
c.innerHTML = `
<div class="latest-card" data-release-artist="${escapeHtml(r.artist)}" data-release-name="${escapeHtml(r.release)}">
<div class="latest-top">
<span class="pill">Свежая оценка</span>
<span class="latest-date">${escapeHtml(dateLabel)}</span>
</div>
<div class="latest-body">
${coverHTML({ artist: r.artist, album: r.release, explicitUrl: r.cover_url, sizeClass: "large" })}
<div class="latest-info">
<div class="latest-title" title="${escapeHtml(r.release)}">${escapeHtml(r.release)}</div>
<div class="latest-artist">${renderArtistLinks(r.artist)}</div>
<div class="latest-meta">${escapeHtml(r.type || "Релиз")}${trackLabel}</div>
</div>
<div class="latest-score-box">
<div class="score" style="color:${scoreCol};filter:drop-shadow(0 2px 10px ${scoreCol}55);">${scoreVal}</div>
<div class="score-label">Балл</div>
</div>
</div>
</div>
`;
}
let currentTopMode = "trending";
function parseAnyDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Поддержка ДД.ММ.ГГГГ и ДД/ММ/ГГГГ (на случай если в таблице такой формат)
  const ruMatch = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (ruMatch) {
    const dt = new Date(Number(ruMatch[3]), Number(ruMatch[2]) - 1, Number(ruMatch[1]));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function getReleasesForTrending(releases) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  return releases.filter(r => {
    const dt = parseAnyDate(r.release_date);
    return dt !== null && dt >= threeMonthsAgo;
  });
}

function calculateArtistStatsForReleases(entry, releasesToUse, isTrending = false) {
  const artistName = entry.name;
  const allTracks = [];
  const seenKeys = new Set();

  for (const r of releasesToUse) {
    const tracks = Array.isArray(r.tracks) ? r.tracks : [];
    const mainArtists = splitArtists(r.artist);
    const isMainArtist = mainArtists.includes(artistName);

    for (const t of tracks) {
      if (t.track_key && seenKeys.has(t.track_key)) continue;
      if (t.track_key) seenKeys.add(t.track_key);

      const featList = t.feat ? t.feat.split(";").map(s => s.trim()).filter(Boolean) : [];
      const isFeat = featList.includes(artistName);
      if (!isMainArtist && !isFeat) continue;

      const weight = isMainArtist ? 1.0 : 0.6;
      const score = Number(t.avg1000) || 0;
      if (score === 0) continue;

      allTracks.push({ score: score * weight, weight });
    }
  }

  let weightedTotal = 0;
  let weightedCount = 0;
  for (const t of allTracks) {
    weightedTotal += t.score;
    weightedCount += t.weight;
  }

  const rawAvg = weightedCount > 0 ? (weightedTotal / weightedCount) : 0;
  const bestScore = releasesToUse.length ? Math.max(...releasesToUse.map(r => r.avg1000)) : 0;

  const GLOBAL_AVERAGE = 600;
  const minThreshold = isTrending ? 1 : 5;
  const targetSample = isTrending ? 5 : 20;
  let weightedAvg = null;

  if (weightedCount >= minThreshold) {
    if (weightedCount < targetSample) {
      const virtualWeight = targetSample - weightedCount;
      weightedAvg = (weightedTotal + (GLOBAL_AVERAGE * virtualWeight)) / targetSample;
    } else {
      weightedAvg = weightedTotal / weightedCount;
    }
  }

  return {
    count: releasesToUse.length,
    totalTracks: allTracks.length,
    rawAvg,
    weightedAvg,
    bestScore
  };
}

function renderArtists() {
  const card = $("#artistsCard");
  if (!artistMap.size) { card.innerHTML = `<div class="status">Нет данных для топа</div>`; return; }

  const isTrending = currentTopMode === "trending";
  const trendingAllReleases = isTrending ? getReleasesForTrending(allReleases) : null;

  const artists = [...artistMap.values()].map(a => {
    let releasesToUse = a.releases;
    if (isTrending) {
      // Берём как сольные свежие релизы артиста, так и свежие релизы других, где он на фите
      releasesToUse = trendingAllReleases.filter(r => {
        if (splitArtists(r.artist).includes(a.name)) return true;
        const tracks = Array.isArray(r.tracks) ? r.tracks : [];
        return tracks.some(t => t.feat && t.feat.split(";").map(s => s.trim()).includes(a.name));
      });
      if (releasesToUse.length === 0) return null;
    }

    const stats = calculateArtistStatsForReleases(a, releasesToUse, isTrending);
    if (isTrending && stats.weightedAvg === null) return null;

    return {
      name: a.name,
      avg: stats.weightedAvg !== null ? stats.weightedAvg : -1,
      count: stats.count,
      totalTracks: stats.totalTracks,
      imageUrl: a.imageUrl
    };
  }).filter(a => a !== null).sort((a, b) => b.avg - a.avg).slice(0, 5);

  if (artists.length === 0) {
    card.innerHTML = `<div class="status">${isTrending ? "Нет оценок релизов, вышедших за последние 3 месяца" : "Нет данных для топа"}</div>`;
    return;
  }

  card.innerHTML = artists.map((a, i) => {
    const bg = artistGradient(a.name);
    const init = escapeHtml(initial(a.name));
    const rankNum = i + 1;
    const imgHTML = a.imageUrl ? `<img src="${escapeHtml(a.imageUrl)}" alt="" onerror="this.remove()">` : "";
    const badge = getTrackBadge(a.totalTracks);
    const scoreVal = Math.round(a.avg);
    const scoreCol = getScoreColor(scoreVal);
    return `
      <div class="artist-row rank-${rankNum}" data-artist="${escapeHtml(a.name)}">
        <span class="rank">${rankNum}</span>
        <div class="avatar-wrap">
          <div class="avatar" style="background:${bg}">
            <span class="cover-initial">${init}</span>${imgHTML}
          </div>
          <div class="avatar-badge" title="${badge.name}">${badge.emoji}</div>
        </div>
        <div class="artist-info">
          <div class="artist-name">${escapeHtml(a.name)}</div>
          <div class="artist-sub">${a.count} ${plural(a.count, "релиз", "релиза", "релизов")} · ${a.totalTracks} ${plural(a.totalTracks, "трек", "трека", "треков")}</div>
        </div>
        <div class="artist-score" style="color:${scoreCol};">${scoreVal}</div>
      </div>
    `;
  }).join("");
}
function renderArtistContent(name) {
const entry = artistMap.get(name);
if (!entry) return;
const content = $("#artistViewContent");
if (content.dataset.lastArtist === name) return;
content.dataset.lastArtist = name;
const releases = entry.releases;
const stats = calculateArtistStats(entry);
const view = $("#artistView");
view.style.setProperty("--artist-glow", artistGlow(name));
const bg = artistGradient(name);
const init = escapeHtml(initial(name));
const avatarImg = entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="" onerror="this.remove()">` : "";
const badge = getTrackBadge(stats.totalTracks);
const yandexArtistLink = sanitizeUrl(entry.yandex_url);
const spotifyArtistLink = sanitizeUrl(entry.spotify_url);
const yandexBtn = yandexArtistLink ? `<a class="release-link-btn" href="${escapeHtml(yandexArtistLink)}" target="_blank" rel="noopener noreferrer"><span class="release-link-text">Артист на Яндекс Музыке</span><span class="release-link-arrow">↗</span></a>` : "";
const spotifyBtn = spotifyArtistLink ? `<a class="release-link-btn" href="${escapeHtml(spotifyArtistLink)}" target="_blank" rel="noopener noreferrer"><span class="release-link-text">Артист на Spotify</span><span class="release-link-arrow">↗</span></a>` : "";
const artistLinksHTML = (yandexBtn || spotifyBtn) ? `<div class="artist-links">${yandexBtn}${spotifyBtn}</div>` : "";
const onScoreVal = stats.weightedAvg !== null ? Math.round(stats.weightedAvg) : null;
const onScoreCol = onScoreVal !== null ? getScoreColor(onScoreVal) : "var(--muted)";
const bestScoreVal = Math.round(stats.bestScore);
const bestScoreCol = getScoreColor(bestScoreVal);

// Собираем все элементы (релизы + фиты) в один список
const allItems = [];

// Добавляем релизы
for (const r of releases) {
const trackLabel = r.track_count ? ` · ${r.track_count} ${plural(r.track_count, "трек", "трека", "треков")}` : "";
const dateLabel = r.date ? " · " + formatDateRu(r.date) : "";
const scoreVal = Math.round(r.avg1000);
allItems.push({
score: scoreVal,
type: 'release',
data: r
});
}

// Добавляем фиты (ищем во всех релизах)
for (const r of allReleases) {
const tracks = Array.isArray(r.tracks) ? r.tracks : [];
for (const t of tracks) {
const featList = t.feat ? t.feat.split(";").map(s => s.trim()).filter(Boolean) : [];
if (featList.includes(name)) {
const tScoreVal = Math.round(t.avg1000);
allItems.push({
score: tScoreVal,
type: 'feat',
data: { release: r, track: t }
});
}
}
}

// Сортируем по баллу (убывание)
allItems.sort((a, b) => b.score - a.score);

// Рендерим с красивой нумерацией
const internalTop = allItems.map((item, i) => {
const rankHTML = `<span class="rank">${i + 1}</span>`;

if (item.type === 'release') {
const r = item.data;
const trackLabel = r.track_count ? ` · ${r.track_count} ${plural(r.track_count, "трек", "трека", "треков")}` : "";
const dateLabel = r.date ? " · " + formatDateRu(r.date) : "";
const scoreVal = Math.round(r.avg1000);
return `
<div class="internal-top-item" data-release-artist="${escapeHtml(r.artist)}" data-release-name="${escapeHtml(r.release)}">
${rankHTML}
${coverHTML({ artist: r.artist, album: r.release, explicitUrl: r.cover_url, sizeClass: "small" })}
<div class="item-info">
<div class="item-title">${escapeHtml(r.release)}</div>
<div class="item-artist">${escapeHtml(r.type || "")}${trackLabel}${dateLabel}</div>
</div>
<div class="item-score" style="color:${getScoreColor(scoreVal)};">${scoreVal}</div>
</div>
`;
} else {
const { release: r, track: t } = item.data;
const tScoreVal = Math.round(t.avg1000);
const isSkipped = !t.avg1000 || t.avg1000 === 0;
const scoreDisplay = isSkipped ? "—" : tScoreVal;
const scoreStyle = isSkipped ? "color:var(--muted);" : `color:${getScoreColor(tScoreVal)};`;
return `
<div class="internal-top-item" data-release-artist="${escapeHtml(r.artist)}" data-release-name="${escapeHtml(r.release)}" data-track-key="${escapeHtml(t.track_key)}">
${rankHTML}
${coverHTML({ artist: r.artist, album: r.release, explicitUrl: r.cover_url, sizeClass: "small" })}
<div class="item-info">
<div class="item-title">${escapeHtml(t.song_name)}</div>
<div class="item-artist">фит · ${escapeHtml(r.release)}</div>
</div>
<div class="item-score" style="${scoreStyle}">${scoreDisplay}</div>
</div>
`;
}
}).join("");

content.innerHTML = `
<div class="artist-hero">
<div class="avatar-wrap">
<div class="avatar" style="background:${bg}">
<span class="cover-initial">${init}</span>${avatarImg}
</div>
<div class="avatar-badge" title="${badge.name}">${badge.emoji}</div>
</div>
<h1 class="artist-hero-name">${escapeHtml(name)}</h1>
<div class="artist-hero-stats">
<span class="stat-chip rank-chip" data-rank-name="${escapeHtml(badge.name)}">${badge.emoji} ${badge.name}</span>
<span class="stat-chip"><strong>${stats.count}</strong> ${plural(stats.count, "релиз", "релиза", "релизов")}</span>
<span class="stat-chip"><strong>${stats.totalTracks}</strong> ${plural(stats.totalTracks, "трек", "трека", "треков")}</span>
<span class="stat-chip oscore-chip">балл onScore: <strong style="color:${onScoreCol};">${onScoreVal !== null ? onScoreVal : "недостаточно данных"}</strong><span class="info-icon">?</span></span>
<span class="stat-chip">Лучший релиз: <strong style="color:${bestScoreCol};">${bestScoreVal}</strong></span>
</div>
${artistLinksHTML}
</div>
<div class="internal-top-title">Все релизы артиста (по баллам)</div>
<div class="internal-top">${internalTop}</div>
`;
content.scrollTop = 0;
}
function renderReleaseContent(r) {
const content = $("#releaseViewContent");
const releaseKey = r.artist + ':::' + r.release;
const releaseEl = document.getElementById('releaseView');
const needsHighlight = releaseEl && releaseEl._highlightTrackKey;

// Если ключ тот же, но подсветка НЕ нужна — выходим досрочно
if (content.dataset.lastRelease === releaseKey && !needsHighlight) return;
content.dataset.lastRelease = releaseKey;

const trackLabel = r.track_count ? `${r.track_count} ${plural(r.track_count, "трек", "трека", "треков")}` : "";
const typeLine = [r.type, trackLabel].filter(Boolean).join(" · ");
const yandexRelLink = sanitizeUrl(r.relise_url_yandex || r.release_url_yandex);
const spotifyRelLink = sanitizeUrl(r.relise_url_spotiify || r.release_url_spotify || r.relise_url_spotify);
const yandexRelBtn = yandexRelLink ? `<a class="release-link-btn" href="${escapeHtml(yandexRelLink)}" target="_blank" rel="noopener noreferrer"><span class="release-link-text">Релиз на Яндекс Музыке</span><span class="release-link-arrow">↗</span></a>` : "";
const spotifyRelBtn = spotifyRelLink ? `<a class="release-link-btn" href="${escapeHtml(spotifyRelLink)}" target="_blank" rel="noopener noreferrer"><span class="release-link-text">Релиз на Spotify</span><span class="release-link-arrow">↗</span></a>` : "";
const releaseLinksHTML = (yandexRelBtn || spotifyRelBtn) ? `<div class="release-links">${yandexRelBtn}${spotifyRelBtn}</div>` : "";
const releaseDateHTML = r.release_date ? `<div class="release-date-item"><span class="release-date-label">Дата выхода</span><span class="release-date-value">${escapeHtml(formatDateRu(r.release_date))}</span></div>` : "";
const assessDateHTML = r.date ? `<div class="release-date-item"><span class="release-date-label">Оценено</span><span class="release-date-value">${escapeHtml(formatDateRu(r.date))}</span></div>` : "";
const datesHTML = (releaseDateHTML || assessDateHTML) ? `<div class="release-dates">${releaseDateHTML}${assessDateHTML}</div>` : "";
const descHTML = r.description ? `<div class="release-description">${escapeHtml(r.description)}</div>` : "";

const tracks = Array.isArray(r.tracks) ? r.tracks : [];
let tracklistHTML;

if (!tracks.length) {
tracklistHTML = `<div class="status">Треклист пока не заполнен</div>`;
} else {
tracklistHTML = tracks.map(t => {
const dur = t.duration ? `<span class="release-track-duration">${escapeHtml(t.duration)}</span>` : "";
const tScoreVal = Math.round(t.avg1000);
const tScoreCol = getScoreColor(tScoreVal);
const isSkipped = !t.avg1000 || t.avg1000 === 0;

const featList = t.feat ? t.feat.split(";").map(s => s.trim()).filter(Boolean) : [];
const featHTML = featList.length > 0 ?
` <span class="track-feat">feat. ${featList.map(f =>
`<span class="artist-link" data-artist="${escapeHtml(f)}">${escapeHtml(f)}</span>`
).join(", ")}</span>` : "";

const trackClass = isSkipped ? "release-track skipped" : "release-track";
const scoreDisplay = isSkipped ? "—" : tScoreVal;
const scoreStyle = isSkipped ? "color:var(--muted);" : `color:${tScoreCol};`;

return `
<div class="${trackClass}" data-track-key="${escapeHtml(t.track_key || "")}" data-track-name="${escapeHtml(t.song_name || "")}">
<span class="release-track-num">${escapeHtml(t.track_number ?? "")}</span>
<div class="release-track-info">
<div class="release-track-name">${escapeHtml(t.song_name || "")}${featHTML}</div>
${dur}
</div>
<div class="release-track-score" style="${scoreStyle}">${scoreDisplay}</div>
</div>
`;
}).join("");
}

const relScoreVal = Math.round(r.avg1000);
const relScoreCol = getScoreColor(relScoreVal);

content.innerHTML = `
<div class="release-hero">
<div class="release-hero-cover">
${coverHTML({ artist: r.artist, album: r.release, explicitUrl: r.cover_url, sizeClass: "xl" })}
</div>
<div class="release-hero-info">
<h1 class="release-hero-title">${escapeHtml(r.release)}</h1>
<div class="release-hero-artists">${renderArtistLinks(r.artist)}</div>
${typeLine ? `<div class="release-hero-type">${escapeHtml(typeLine)}</div>` : ""}
</div>
<div class="release-hero-score">
<div class="release-hero-score-num" style="color:${relScoreCol};filter:drop-shadow(0 2px 10px ${relScoreCol}55);">${relScoreVal}</div>
<div class="release-hero-score-label">Балл</div>
</div>
</div>
${releaseLinksHTML}
${datesHTML}
${descHTML}
<div class="release-tracklist-title">Содержимое релиза</div>
<div class="release-tracklist">${tracklistHTML}</div>
`;

// ЛОГИКА ПОДСВЕТКИ И СКРОЛЛА
if (needsHighlight) {
// Небольшая задержка, чтобы браузер успел отрисовать новый DOM перед скроллом
setTimeout(() => {
const trackEl = content.querySelector(`[data-track-key="${releaseEl._highlightTrackKey}"]`);
if (trackEl) {
trackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
trackEl.classList.add('highlight');
setTimeout(() => trackEl.classList.remove('highlight'), 1500);
}
// Очищаем флаг после выполнения
releaseEl._highlightTrackKey = null;
}, 100);
} else {
// Скроллим наверх ТОЛЬКО если подсветка не нужна
content.scrollTop = 0;
}
}
function openArtist(name) {
if (!artistMap.has(name)) return;
const top = navStack[navStack.length - 1];
if (top && top.type === 'artist' && top.name === name) return;
haptic("light");
pushNav({ type: 'artist', name });
}
function openRelease(artistName, releaseName, trackKey = null) {
const rel = allReleases.find(r => r.artist === artistName && r.release === releaseName);
if (!rel) return;

const top = navStack[navStack.length - 1];

// Если мы УЖЕ на этом релизе, но кликнули на фит (пришел новый trackKey)
if (top && top.type === 'release' && top.artist === artistName && top.release === releaseName) {
if (trackKey) {
const releaseEl = document.getElementById('releaseView');
if (releaseEl) {
releaseEl._highlightTrackKey = trackKey;
renderReleaseContent(rel); // Принудительно запускаем рендер для подсветки
}
}
return;
}

haptic("light");
const releaseEl = document.getElementById('releaseView');
if (releaseEl) {
releaseEl._needsReplay = true;
releaseEl._highlightTrackKey = trackKey;
}
pushNav({ type: 'release', artist: artistName, release: releaseName });
}
function openLegend(rankName = null) {
const top = navStack[navStack.length - 1];
if (top && top.type === 'legend') return;
currentRankName = rankName;
haptic("light");
pushNav({ type: 'legend' });
}
function openOscore() {
const top = navStack[navStack.length - 1];
if (top && top.type === 'oscore') return;
haptic("light");
pushNav({ type: 'oscore' });
}
document.addEventListener("click", e => {
const rankChip = e.target.closest(".stat-chip.rank-chip");
if (rankChip) {
e.preventDefault(); e.stopPropagation();
openLegend(rankChip.dataset.rankName || null);
return;
}
const oscoreChip = e.target.closest(".stat-chip.oscore-chip");
if (oscoreChip) {
e.preventDefault(); e.stopPropagation();
openOscore();
return;
}
const link = e.target.closest(".artist-link");
if (link) {
e.stopPropagation(); e.preventDefault();
const artist = link.getAttribute("data-artist");
if (artist) openArtist(artist);
return;
}
const row = e.target.closest(".artist-row");
if (row && row.dataset.artist) {
e.preventDefault();
openArtist(row.dataset.artist);
return;
}
const releaseEl = e.target.closest("[data-release-name]");
if (releaseEl) {
e.preventDefault();
const a = releaseEl.dataset.releaseArtist;
const r = releaseEl.dataset.releaseName;
const trackKey = releaseEl.dataset.trackKey || null;
if (a && r) openRelease(a, r, trackKey);
return;
}
});
$("#backBtn").addEventListener("click", goBack);
$("#releaseBackBtn").addEventListener("click", goBack);
$("#legendCloseBtn").addEventListener("click", goBack);
$("#legendBackdrop").addEventListener("click", goBack);
$("#oscoreCloseBtn").addEventListener("click", goBack);
$("#oscoreBackdrop").addEventListener("click", goBack);
const legendAccBtn = $("#legendAccBtn");
const legendAccContent = $("#legendAccContent");
legendAccBtn.addEventListener("click", () => {
const open = legendAccContent.classList.toggle("open");
legendAccBtn.setAttribute("aria-expanded", String(open));
haptic("selection_change");
});
const openCatalogBtn = document.getElementById("openCatalogBtn");
if (openCatalogBtn) openCatalogBtn.addEventListener("click", openCatalog);
const catalogBackBtn = document.getElementById("catalogBackBtn");
if (catalogBackBtn) catalogBackBtn.addEventListener("click", goBack);
const openParamsBtn = document.getElementById("openParamsBtn");
if (openParamsBtn) openParamsBtn.addEventListener("click", openCatalogParams);
const paramsBackBtn = document.getElementById("paramsBackBtn");
if (paramsBackBtn) paramsBackBtn.addEventListener("click", goBack);
const catalogResetBtn = document.getElementById("catalogResetBtn");
if (catalogResetBtn) catalogResetBtn.addEventListener("click", resetAllFilters);
const emptyResetBtn = document.getElementById("emptyResetBtn");
if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetAllFilters);
const paramsResetBtn = document.getElementById("paramsResetBtn");
if (paramsResetBtn) paramsResetBtn.addEventListener("click", resetAllFilters);
const paramsApplyBtn = document.getElementById("paramsApplyBtn");
if (paramsApplyBtn) paramsApplyBtn.addEventListener("click", goBack);
document.querySelectorAll(".top-tab").forEach(tab => {
tab.addEventListener("click", () => {
document.querySelectorAll(".top-tab").forEach(t => t.classList.remove("active"));
tab.classList.add("active");
currentTopMode = tab.getAttribute("data-top-mode");
renderArtists();
haptic("selection_change");
});
});
let searchDebounceTimer = null;
const catalogSearchInput = document.getElementById("catalogSearchInput");
const searchClearBtn = document.getElementById("searchClearBtn");
if (catalogSearchInput) {
catalogSearchInput.addEventListener("input", (e) => {
const val = e.target.value;
if (searchClearBtn) searchClearBtn.style.display = val.trim() ? "flex" : "none";
clearTimeout(searchDebounceTimer);
searchDebounceTimer = setTimeout(() => {
catalogState.search = val;
saveCatalogStateDebounced();
renderCatalog();
const liveCounter = document.getElementById("paramsLiveCounter");
if (liveCounter) {
const filtered = getFilteredReleases();
liveCounter.textContent = `Найдено ${filtered.length} ${plural(filtered.length, "релиз", "релиза", "релизов")}`;
}
}, 150);
});
}
if (searchClearBtn) {
searchClearBtn.addEventListener("click", () => {
clearTimeout(searchDebounceTimer);
if (catalogSearchInput) {
catalogSearchInput.value = "";
catalogSearchInput.focus();
}
searchClearBtn.style.display = "none";
catalogState.search = "";
saveCatalogStateDebounced();
renderCatalog();
haptic("light");
});
}
document.addEventListener("change", (e) => {
if (e.target.name === "catalogSort") {
catalogState.sort = e.target.value;
saveCatalogStateDebounced();
renderCatalog();
renderCatalogParams();
haptic("selection_change");
}
});
document.addEventListener("click", (e) => {
const typeBtn = e.target.closest("#paramTypeChips .param-chip");
if (typeBtn) {
const t = typeBtn.getAttribute("data-type");
if (catalogState.types.includes(t)) catalogState.types = catalogState.types.filter(item => item !== t);
else catalogState.types.push(t);
saveCatalogStateDebounced(); renderCatalog(); renderCatalogParams(); haptic("selection_change");
return;
}
const yearBtn = e.target.closest("#paramYearChips .param-chip");
if (yearBtn) {
const y = yearBtn.getAttribute("data-year");
if (catalogState.years.includes(y)) catalogState.years = catalogState.years.filter(item => item !== y);
else catalogState.years.push(y);
const { yearMonthMap } = getAvailableFilterData();
const validMonths = new Set();
catalogState.years.forEach(yr => { if (yearMonthMap[yr]) yearMonthMap[yr].forEach(m => validMonths.add(m)); });
catalogState.months = catalogState.months.filter(m => validMonths.has(m));
saveCatalogStateDebounced(); renderCatalog(); renderCatalogParams(); haptic("selection_change");
return;
}
const monthBtn = e.target.closest("#paramMonthChips .param-chip");
if (monthBtn) {
const m = monthBtn.getAttribute("data-month");
if (catalogState.months.includes(m)) catalogState.months = catalogState.months.filter(item => item !== m);
else catalogState.months.push(m);
saveCatalogStateDebounced(); renderCatalog(); renderCatalogParams(); haptic("selection_change");
return;
}
const presetBtn = e.target.closest("#paramScorePresetChips .param-chip");
if (presetBtn) {
const p = presetBtn.getAttribute("data-preset");
if (catalogState.scorePresets.includes(p)) catalogState.scorePresets = catalogState.scorePresets.filter(item => item !== p);
else catalogState.scorePresets.push(p);
saveCatalogStateDebounced(); renderCatalog(); renderCatalogParams(); haptic("selection_change");
return;
}
});
const customMinInput = document.getElementById("customScoreMin");
const customMaxInput = document.getElementById("customScoreMax");
const customRangeClearBtn = document.getElementById("customRangeClearBtn");
function handleCustomRangeInput() {
let minVal = customMinInput && customMinInput.value !== "" ? Number(customMinInput.value) : null;
let maxVal = customMaxInput && customMaxInput.value !== "" ? Number(customMaxInput.value) : null;
if (minVal !== null && isNaN(minVal)) minVal = null;
if (maxVal !== null && isNaN(maxVal)) maxVal = null;
if (minVal !== null) minVal = Math.max(0, Math.min(1000, minVal));
if (maxVal !== null) maxVal = Math.max(0, Math.min(1000, maxVal));
catalogState.customScoreMin = minVal;
catalogState.customScoreMax = maxVal;
if (customRangeClearBtn) {
const hasCustom = catalogState.customScoreMin !== null || catalogState.customScoreMax !== null;
customRangeClearBtn.style.display = hasCustom ? "flex" : "none";
}
saveCatalogStateDebounced();
renderCatalog();
const liveCounter = document.getElementById("paramsLiveCounter");
if (liveCounter) {
const filtered = getFilteredReleases();
liveCounter.textContent = `Найдено ${filtered.length} ${plural(filtered.length, "релиз", "релиза", "релизов")}`;
}
}
if (customMinInput) customMinInput.addEventListener("input", handleCustomRangeInput);
if (customMaxInput) customMaxInput.addEventListener("input", handleCustomRangeInput);
function handleRangeBlur() {
const minVal = catalogState.customScoreMin;
const maxVal = catalogState.customScoreMax;
if (minVal !== null && maxVal !== null && minVal > maxVal) {
catalogState.customScoreMin = maxVal;
catalogState.customScoreMax = minVal;
if (customMinInput) customMinInput.value = String(maxVal);
if (customMaxInput) customMaxInput.value = String(minVal);
saveCatalogStateDebounced();
renderCatalog();
const liveCounter = document.getElementById("paramsLiveCounter");
if (liveCounter) {
const filtered = getFilteredReleases();
liveCounter.textContent = `Найдено ${filtered.length} ${plural(filtered.length, "релиз", "релиза", "релизов")}`;
}
}
}
if (customMinInput) customMinInput.addEventListener("change", handleRangeBlur);
if (customMaxInput) customMaxInput.addEventListener("change", handleRangeBlur);
if (customRangeClearBtn) {
customRangeClearBtn.addEventListener("click", () => {
if (customMinInput) customMinInput.value = "";
if (customMaxInput) customMaxInput.value = "";
catalogState.customScoreMin = null;
catalogState.customScoreMax = null;
customRangeClearBtn.style.display = "none";
saveCatalogStateDebounced(); renderCatalog(); renderCatalogParams(); haptic("light");
});
}
async function loadData() {
try {
const res = await fetch(API_URL, { cache: "no-cache" });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
let rawReleases = [];
if (Array.isArray(data)) {
rawReleases = data;
globalArtistImages = {};
globalArtistLinks = {};
} else {
rawReleases = data.releases || [];
globalArtistImages = data.artists || {};
globalArtistLinks = data.artist_links || {};
}
allReleases = rawReleases.map((r, index) => ({
artist: r.artist || "",
release: r.release || "",
type: r.type || "",
track_count: Math.max(1, Number(r.track_count) || 1),
system: r.system || "",
cover_url: r.cover_url || "",
date: r.date || "",
release_date: r.release_date || "",
description: r.description || "",
relise_url_yandex: r.relise_url_yandex || r.release_url_yandex || "",
relise_url_spotiify: r.relise_url_spotiify || r.release_url_spotify || r.relise_url_spotify || "",
artist_url_yandex: r.artist_url_yandex || "",
artist_url_spotify: r.artist_url_spotify || "",
tracks: Array.isArray(r.tracks) ? r.tracks : [],
avg: Number(r.avg) || 0,
avg1000: Number(r.avg1000) || 0,
_row: Number.isFinite(r._row) ? Number(r._row) : (index + 1)
})).filter(r => r.release && r.artist);
buildArtistMap();
renderLegend();
if (allReleases.length) renderLatest(allReleases[0]);
else renderLatest(null);
renderArtists();
const btnCount = document.getElementById("catalogBtnCount");
if (btnCount) btnCount.textContent = allReleases.length ? String(allReleases.length) : "0";
renderCatalog();
} catch (err) {
console.error(err);
$("#latestContainer").innerHTML = `<div class="error-block">Не удалось загрузить данные из таблицы.<br><small style="opacity:.8">${escapeHtml(err.message)}</small></div>`;
$("#artistsCard").innerHTML = `<div class="status">Ошибка загрузки данных</div>`;
}
}
loadCatalogState();
renderLegend();
renderTopOverlay();
const INERT_TARGETS = ['artistView', 'releaseView', 'catalogView', 'catalogParamsView', 'legendModal', 'oscoreModal'];
const inertObserver = new MutationObserver(mutations => {
for (const m of mutations) {
const el = m.target;
el.inert = !el.classList.contains('open');
}
});
INERT_TARGETS.forEach(id => {
const el = document.getElementById(id);
if (!el) return;
el.inert = !el.classList.contains('open');
inertObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
});
loadData();
