const API_KEY = 'db560b79';
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

let allResults = []; // semua hasil unik
let currentIndex = 0; // indeks untuk load-more
const LOAD_STEP = 10;

async function translateToIndonesia(text) {
    if (!text || text === 'N/A') return 'Sinopsis tidak tersedia';
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        return data[0][0][0] || text;
    } catch {
        return text;
    }
}

// ambil semua hasil (maks 5 halaman = 50 item)
async function searchMovie() {
    const keyword = document.getElementById('titleInput').value.trim();
    if (!keyword) return;

    const pages = [1, 2, 3, 4, 5]; // maks 50 item
    let raw = [];

    for (const p of pages) {
        const res = await fetch(
            `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(keyword)}&type=movie&page=${p}`
        );
        const data = await res.json();
        if (data.Response === 'True') raw.push(...data.Search);
        else break; // stop jika halaman kosong
    }

    // hilangkan duplikat berdasarkan imdbID
    const unique = [];
    const seen = new Set();
    raw.forEach(m => {
        if (!seen.has(m.imdbID)) {
            seen.add(m.imdbID);
            unique.push(m);
        }
    });

    allResults = unique.slice(0, 50); // pastikan maks 50
    currentIndex = 0;

    renderResults();
}

// render 10 item pertama + tambah tombol load-more jika masih ada
function renderResults() {
    const container = document.getElementById('results');
    // clear sebelumnya hanya saat search baru
    if (currentIndex === 0) container.innerHTML = '';

    const nextBatch = allResults.slice(currentIndex, currentIndex + LOAD_STEP);
    nextBatch.forEach(async m => {
        const detail = await (
            await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${m.imdbID}&plot=short`)
        ).json();
        const translatedPlot = await translateToIndonesia(detail.Plot);

        const actors = detail.Actors !== 'N/A' ? detail.Actors.split(',').slice(0, 5).join(', ') : 'Tidak tersedia';
        const genres = detail.Genre !== 'N/A' ? detail.Genre.split(',').slice(0, 5).join(', ') : 'Tidak tersedia';
        const director = detail.Director !== 'N/A' ? detail.Director : 'Tidak tersedia';

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${m.Poster !== 'N/A' ? m.Poster : 'https://via.placeholder.com/80x120?text=No+Image'}" alt="${m.Title}">
            <div class="movie-info">
                <h3>
                    <a href="https://www.imdb.com/title/${m.imdbID}" target="_blank" rel="noopener noreferrer">
                        ${m.Title} (${m.Year})
                    </a>
                </h3>
                <p><strong>Sutradara:</strong> ${director}</p>
                <p><strong>Pemeran:</strong> ${actors}</p>
                <p><strong>Genre:</strong> ${genres}</p>
                <p class="synopsis"><strong>Sinopsis:</strong> ${translatedPlot}</p>
                <button onclick="addToWatchlist('${m.imdbID}')">Tambahkan ke Watchlist</button>
            </div>
        `;
        container.appendChild(card);
    });

    currentIndex += LOAD_STEP;

    // sembunyikan / tampilkan tombol Load More
    const oldBtn = document.getElementById('loadMoreBtn');
    if (oldBtn) oldBtn.remove();

    if (currentIndex < allResults.length) {
        const loadBtn = document.createElement('button');
        loadBtn.id = 'loadMoreBtn';
        loadBtn.textContent = 'Load More';
        loadBtn.onclick = renderResults;
        document.getElementById('results').appendChild(loadBtn);
    }
}
// --- fungsi addToWatchlist, displayWatchlist, dll tetap sama (copy dari sebelumnya) ---
