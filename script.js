const API_KEY = 'db560b79';
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let allResults = [];
let currentIndex = 0;
const STEP = 5; // 5 per baris

// translate
const trID = async (t) => {
  if (!t || t === 'N/A') return 'Sinopsis tidak tersedia';
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(t)}`);
    return (await res.json())[0][0][0] || t;
  } catch { return t; }
};

// imdb link
const imdbLink = (txt, type = 'name') => {
  const base = type === 'genre' ? 'https://www.imdb.com/search/title/?genres=' : 'https://www.imdb.com/find/?q=';
  return `<a href="${base}${encodeURIComponent(txt)}" target="_blank" rel="noopener">${txt}</a>`;
};

// search
document.getElementById('keyword').addEventListener('keydown', e => { if (e.key === 'Enter') searchMovie(); });
document.getElementById('searchBtn').addEventListener('click', searchMovie);

async function searchMovie() {
  const kw = document.getElementById('keyword').value.trim();
  if (!kw) return;
  const pages = [1, 2, 3, 4, 5];
  let raw = [];
  for (const p of pages) {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(kw)}&type=movie&page=${p}`);
    const data = await res.json();
    if (data.Response === 'True') raw.push(...data.Search); else break;
  }
  const seen = new Set();
  allResults = raw.filter(m => !seen.has(m.imdbID) && seen.add(m.imdbID)).slice(0, 50);
  currentIndex = 0;
  renderResults(true);
}

async function renderResults(clear = true) {
  const container = document.getElementById('results');
  if (clear) container.innerHTML = '';
  const slice = allResults.slice(currentIndex, currentIndex + STEP);
  for (const m of slice) {
    const d = await (await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${m.imdbID}&plot=short`)).json();
    const plot = await trID(d.Plot);
    const actors = d.Actors !== 'N/A' ? d.Actors.split(',').slice(0, 5).map(a => imdbLink(a.trim())).join(', ') : 'Tidak tersedia';
    const genres = d.Genre !== 'N/A' ? d.Genre.split(',').slice(0, 5).map(g => imdbLink(g.trim(), 'genre')).join(', ') : 'Tidak tersedia';
    const director = d.Director !== 'N/A' ? imdbLink(d.Director.trim()) : 'Tidak tersedia';

    const card = document.createElement('div');
    card.className = 'movie-card-horizontal';
    card.innerHTML = `
      <img src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${m.Title}">
      <div class="card-body">
        <h3>${imdbLink(`${m.Title} (${m.Year})`, 'title')}</h3>
        <p><strong>Sutradara:</strong> ${director}</p>
        <p><strong>Pemeran:</strong> ${actors}</p>
        <p><strong>Genre:</strong> ${genres}</p>
        <p><strong>Sinopsis:</strong> ${plot}</p>
        <button onclick="addToWatchlist('${m.imdbID}')">+ Watchlist</button>
      </div>
    `;
    container.appendChild(card);
  }
  currentIndex += STEP;
  document.getElementById('loadMoreBtn')?.remove();
  if (currentIndex < allResults.length) {
    const btn = document.createElement('button');
    btn.id = 'loadMoreBtn';
    btn.textContent = 'Load More';
    btn.className = 'load-more';
    btn.onclick = () => renderResults(false);
    container.appendChild(btn);
  }
}

// watchlist
async function addToWatchlist(id) {
  if (watchlist.some(w => w.id === id)) return alert('Sudah ada di watchlist');
  const d = await (await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`)).json();
  const plot = await trID(d.Plot);
  watchlist.unshift({
    id: d.imdbID,
    title: d.Title,
    year: d.Year,
    poster: d.Poster,
    plot,
    director: d.Director,
    actors: d.Actors,
    genres: d.Genre,
    rating: 0
  });
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}

function renderWatchlist() {
  const box = document.getElementById('watchlistItems');
  box.innerHTML = watchlist.length
    ? ''
    : '<p style="text-align:center;color:var(--muted)">Belum ada film ditonton</p>';
  watchlist.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'movie-card-horizontal';
    card.style.maxWidth = '100%';
    card.innerHTML = `
      <img src="${m.poster !== 'N/A' ? m.poster : 'https://via.placeholder.com/120x180?text=No+Image'}" alt="${m.title}">
      <div class="card-body">
        <h3>${imdbLink(`${m.title} (${m.year})`, 'title')}</h3>
        <p><strong>Sutradara:</strong> ${imdbLink(m.director)}</p>
        <p><strong>Pemeran:</strong> ${m.actors.split(',').map(a => imdbLink(a.trim())).join(', ')}</p>
        <p><strong>Genre:</strong> ${m.genres.split(',').map(g => imdbLink(g.trim(), 'genre')).join(', ')}</p>
        <p><strong>Sinopsis:</strong> ${m.plot}</p>
        <div>${[...Array(5)].map((_, idx) =>
          `<span class="star ${idx < m.rating ? 'active' : ''}" onclick="rate(${i}, ${idx + 1})">★</span>`
        ).join('')}</div>
        <button onclick="remove(${i})">Hapus</button>
      </div>
    `;
    box.appendChild(card);
  });
}

function rate(i, stars) {
  watchlist[i].rating = stars;
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}
function remove(i) {
  watchlist.splice(i, 1);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}

renderWatchlist();
