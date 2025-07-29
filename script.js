const API_KEY = 'db560b79';
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let allResults = [];
let currentIndex = 0;
const STEP = 10;

// translate
async function trID(text) {
  if (!text || text === 'N/A') return 'Sinopsis tidak tersedia';
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0][0][0];
  } catch {
    return text;
  }
}

// enter key
document.getElementById('keyword').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchMovie();
});
document.getElementById('searchBtn').addEventListener('click', searchMovie);

async function searchMovie() {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) return;

  const pages = [1, 2, 3, 4, 5];
  let raw = [];
  for (const p of pages) {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(keyword)}&type=movie&page=${p}`);
    const data = await res.json();
    if (data.Response === 'True') raw.push(...data.Search);
    else break;
  }

  // deduplicate
  const seen = new Set();
  allResults = raw.filter(m => {
    if (seen.has(m.imdbID)) return false;
    seen.add(m.imdbID);
    return true;
  }).slice(0, 50);

  currentIndex = 0;
  renderResults(true);
}

async function renderResults(clear = false) {
  const container = document.getElementById('results');
  if (clear) container.innerHTML = '';

  const slice = allResults.slice(currentIndex, currentIndex + STEP);
  for (const m of slice) {
    const detail = await (await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${m.imdbID}&plot=short`)).json();
    const plot = await trID(detail.Plot);
    const actors = detail.Actors !== 'N/A' ? detail.Actors.split(',').slice(0, 5).join(', ') : 'Tidak tersedia';
    const genres = detail.Genre !== 'N/A' ? detail.Genre.split(',').slice(0, 5).join(', ') : 'Tidak tersedia';
    const director = detail.Director !== 'N/A' ? detail.Director : 'Tidak tersedia';

    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/120x180?text=No+Image'}" alt="${m.Title}">
      <div class="movie-info">
        <h3><a href="https://www.imdb.com/title/${m.imdbID}" target="_blank">${m.Title} (${m.Year})</a></h3>
        <p><strong>Sutradara:</strong> ${director}</p>
        <p><strong>Pemeran:</strong> ${actors}</p>
        <p><strong>Genre:</strong> ${genres}</p>
        <p class="synopsis"><strong>Sinopsis:</strong> ${plot}</p>
        <button onclick="addToWatchlist('${m.imdbID}')">Tambahkan ke Watchlist</button>
      </div>
    `;
    container.appendChild(card);
  }

  currentIndex += STEP;

  // load-more button
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

async function addToWatchlist(id) {
  if (watchlist.some(m => m.id === id)) return alert('Sudah ada di watchlist');
  const detail = await (await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`)).json();
  const plot = await trID(detail.Plot);
  const actors = detail.Actors !== 'N/A' ? detail.Actors.split(',').slice(0, 5).join(', ') : 'Tidak tersedia';
  const genres = detail.Genre !== 'N/A' ? detail.Genre.split(',').slice(0, 5).join(', ') : 'Tidak tersedia';
  const director = detail.Director !== 'N/A' ? detail.Director : 'Tidak tersedia';

  watchlist.unshift({
    id: detail.imdbID,
    title: detail.Title,
    year: detail.Year,
    poster: detail.Poster,
    plot,
    director,
    actors,
    genres,
    rating: 0
  });
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}

function renderWatchlist() {
  const container = document.getElementById('watchlistItems');
  container.innerHTML = watchlist.length
    ? ''
    : '<p style="text-align:center;color:var(--muted)">Belum ada film ditonton</p>';

  watchlist.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${m.poster !== 'N/A' ? m.poster : 'https://via.placeholder.com/120x180?text=No+Image'}" alt="${m.title}">
      <div class="movie-info">
        <h3><a href="https://www.imdb.com/title/${m.id}" target="_blank">${m.title} (${m.year})</a></h3>
        <p><strong>Sutradara:</strong> ${m.director}</p>
        <p><strong>Pemeran:</strong> ${m.actors}</p>
        <p><strong>Genre:</strong> ${m.genres}</p>
        <p class="synopsis"><strong>Sinopsis:</strong> ${m.plot}</p>
        <div>${[...Array(5)].map((_, idx) =>
          `<span class="star ${idx < m.rating ? 'active' : ''}" onclick="rate(${i}, ${idx + 1})">★</span>`
        ).join('')}</div>
        <button onclick="remove(${i})">Hapus</button>
      </div>
    `;
    container.appendChild(card);
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
