// --- bagian atas tetap sama ---
const API_KEY = 'db560b79';
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// ambil & terjemahkan sinopsis
async function translateToIndonesia(text) {
    if (!text || text === 'N/A') return 'Sinopsis tidak tersedia';
    try {
        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`
        );
        const data = await res.json();
        return data[0][0][0] || text;
    } catch {
        return text;
    }
}

// pencarian massal (sampai 50 hasil)
async function searchMovie() {
    const keyword = document.getElementById('titleInput').value.trim();
    if (!keyword) return;

    const page1 = await fetchPage(keyword, 1);
    const page2 = await fetchPage(keyword, 2);

    let allMovies = [...page1, ...page2].slice(0, 50);
    displaySearchResults(allMovies);
}

// ambil 1 halaman (max 10 item)
async function fetchPage(keyword, page) {
    const res = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(keyword)}&type=movie&page=${page}`
    );
    const data = await res.json();
    return data.Response === 'True' ? data.Search : [];
}

// tampilkan semua hasil
async function displaySearchResults(movies) {
    const container = document.getElementById('results');
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#aaa;">Tidak ditemukan</p>';
        return;
    }

    for (const m of movies) {
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
    }
}

// --- fungsi addToWatchlist, displayWatchlist, dll tetap sama (copy dari jawaban sebelumnya) ---
