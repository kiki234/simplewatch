const API_KEY = 'db560b79';
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Fungsi terjemahan menggunakan Google Translate API gratis
async function translateToIndonesia(text) {
    if (!text || text === 'N/A') return 'Sinopsis tidak tersedia';
    
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        return data[0][0][0] || text;
    } catch {
        return text; // Fallback ke teks asli jika gagal
    }
}

async function searchMovie() {
    const title = document.getElementById('titleInput').value.trim();
    if (!title) return;

    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(title)}&plot=short`);
    const data = await res.json();

    if (data.Response === 'False') {
        alert('Film tidak ditemukan');
        return;
    }

    const translatedPlot = await translateToIndonesia(data.Plot);
    displayResult(data, translatedPlot);
}

function displayResult(movie, translatedPlot) {
    const div = document.createElement('div');
    div.className = 'movie-card';
    div.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/80x120?text=No+Image'}" alt="${movie.Title}">
        <div class="movie-info">
            <h3>${movie.Title} (${movie.Year})</h3>
            <p class="synopsis"><strong>Sinopsis:</strong> ${translatedPlot}</p>
            <button onclick="addToWatchlist('${movie.imdbID}')">Tambahkan ke Watchlist</button>
        </div>
    `;
    document.getElementById('results').innerHTML = '';
    document.getElementById('results').appendChild(div);
}

async function addToWatchlist(id) {
    if (watchlist.find(m => m.id === id)) return alert('Sudah ada dalam watchlist');

    const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`);
    const movie = await res.json();
    const translatedPlot = await translateToIndonesia(movie.Plot);

    watchlist.unshift({
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster,
        plot: translatedPlot,
        rating: 0
    });

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    displayWatchlist();
    document.getElementById('results').innerHTML = '';
    document.getElementById('titleInput').value = '';
}

function displayWatchlist() {
    const list = document.getElementById('watchlist');
    list.innerHTML = '';

    if (watchlist.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#aaa;">Belum ada film</p>';
        return;
    }

    watchlist.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'movie-card';
        div.innerHTML = `
            <img src="${m.poster !== 'N/A' ? m.poster : 'https://via.placeholder.com/80x120?text=No+Image'}" alt="${m.title}">
            <div class="movie-info">
                <h3>${m.title} (${m.year})</h3>
                <p class="synopsis"><strong>Sinopsis:</strong> ${m.plot}</p>
                <div>${generateStars(i, m.rating)}</div>
                <button onclick="removeMovie(${i})">Hapus</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function generateStars(index, rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? 'active' : ''}" onclick="rateMovie(${index}, ${i})">★</span>`;
    }
    return stars;
}

function rateMovie(index, stars) {
    watchlist[index].rating = stars;
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    displayWatchlist();
}

function removeMovie(index) {
    watchlist.splice(index, 1);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    displayWatchlist();
}

displayWatchlist();
// ... (fungsi lain tetap sama)

function displayResult(movie, translatedPlot) {
    const div = document.createElement('div');
    div.className = 'movie-card';
    div.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/80x120?text=No+Image'}" alt="${movie.Title}">
        <div class="movie-info">
            <h3>
                <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank" rel="noopener noreferrer">
                    ${movie.Title} (${movie.Year})
                </a>
            </h3>
            <p class="synopsis"><strong>Sinopsis:</strong> ${translatedPlot}</p>
            <button onclick="addToWatchlist('${movie.imdbID}')">Tambahkan ke Watchlist</button>
        </div>
    `;
    document.getElementById('results').innerHTML = '';
    document.getElementById('results').appendChild(div);
}

function displayWatchlist() {
    const list = document.getElementById('watchlist');
    list.innerHTML = '';

    if (watchlist.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#aaa;">Belum ada film</p>';
        return;
    }

    watchlist.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'movie-card';
        div.innerHTML = `
            <img src="${m.poster !== 'N/A' ? m.poster : 'https://via.placeholder.com/80x120?text=No+Image'}" alt="${m.title}">
            <div class="movie-info">
                <h3>
                    <a href="https://www.imdb.com/title/${m.id}" target="_blank" rel="noopener noreferrer">
                        ${m.title} (${m.year})
                    </a>
                </h3>
                <p class="synopsis"><strong>Sinopsis:</strong> ${m.plot}</p>
                <div>${generateStars(i, m.rating)}</div>
                <button onclick="removeMovie(${i})">Hapus</button>
            </div>
        `;
        list.appendChild(div);
    });
}
