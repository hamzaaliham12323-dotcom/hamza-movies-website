/* script.js - COMPLETE VERSION WITH TRENDING FIX */

const API_KEY = 'df5ec4a966b9e22c6b9b1fe5904ee8a6'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const ORIGINAL_IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentPage = 1;
let currentSearchTerm = '';
let selectedGenre = [];

const grid = document.getElementById('movieGrid');
const searchBox = document.getElementById('searchBox');
const tagsEl = document.getElementById('tags');
const loadMoreBtn = document.getElementById('loadMore');
const genreTitle = document.getElementById('genreTitle'); // <--- ADDED THIS

// --- INITIAL LOAD ---
if (grid) {
    // Set Default Title
    if(genreTitle) genreTitle.innerHTML = "Trending <span class='highlight'>Movies</span> 🔥";

    setGenre();
    getMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`);
    
    if(loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            if (currentSearchTerm) {
                getMovies(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentSearchTerm}&page=${currentPage}`, true);
            } else if (selectedGenre.length > 0) {
                 getMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&with_genres=${encodeURI(selectedGenre.join(','))}&page=${currentPage}`, true);
            } else {
                getMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&page=${currentPage}`, true);
            }
        });
    }
} 

if (document.getElementById('movieDetails')) {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    if(movieId) {
        getMovieDetails(movieId);
        getCast(movieId);
        getReviews(movieId);
        init3DPoster();
    }
}

async function setGenre() {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await res.json();
    if(!tagsEl) return;
    tagsEl.innerHTML = '';

    // COMING SOON BUTTON
    const upcomingBtn = document.createElement('div');
    upcomingBtn.classList.add('tag', 'tag-special'); 
    upcomingBtn.innerHTML = '<i class="fas fa-rocket"></i> Coming Soon'; 
    upcomingBtn.addEventListener('click', () => {
        removeAllActiveClasses();
        upcomingBtn.classList.add('active');
        selectedGenre = []; currentPage = 1; currentSearchTerm = '';
        
        // UPDATE TITLE
        if(genreTitle) genreTitle.innerHTML = "Coming <span class='highlight'>Soon</span> 🚀";

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];
        getMovies(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&region=US&primary_release_date.gte=${dateString}`);
    });
    tagsEl.append(upcomingBtn);

    // GENRE BUTTONS
    data.genres.forEach(genre => {
        const t = document.createElement('div');
        t.classList.add('tag');
        t.id = genre.id;
        t.innerText = genre.name;
        t.addEventListener('click', () => {
            if(selectedGenre.includes(genre.id)) return;
            removeAllActiveClasses();
            t.classList.add('active');
            selectedGenre = [genre.id]; 
            currentPage = 1; currentSearchTerm = '';

            // UPDATE TITLE DYNAMICALLY
            if(genreTitle) genreTitle.innerHTML = `${genre.name} <span class='highlight'>Movies</span>`;

            getMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}&with_genres=${genre.id}`);
        });
        tagsEl.append(t);
    });
}

function removeAllActiveClasses() {
    document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('active'));
}

async function getMovies(url, isLoadMore = false) {
    if(!isLoadMore && !url.includes('trending')) showSkeletons();
    grid.classList.remove('error-mode');

    // CHECK IF WE ARE BACK TO HOME (Reset Title)
    if(url.includes('sort_by=popularity.desc') && selectedGenre.length === 0 && !currentSearchTerm) {
        if(genreTitle) genreTitle.innerHTML = "Trending <span class='highlight'>Movies</span> 🔥";
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        if(!isLoadMore) grid.innerHTML = '';
        
        if(data.results.length !== 0) {
            showMovies(data.results);
        } else {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-ghost"></i>
                    <h2>No Results Found</h2>
                    <p>We couldn't find matches for "<strong>${currentSearchTerm}</strong>".</p>
                    <p class="fallback-message">But check out these popular movies:</p>
                </div>
            `;
            const fallbackRes = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
            const fallbackData = await fallbackRes.json();
            showMovies(fallbackData.results);
        }
    } catch (error) { console.error("Error:", error); }
}

function showSkeletons() {
    grid.innerHTML = '';
    for(let i=0; i<8; i++) {
        const skel = document.createElement('div');
        skel.classList.add('skeleton');
        grid.appendChild(skel);
    }
}

function showMovies(movies) {
    movies.forEach(movie => {
        const { id, title, poster_path, vote_average } = movie;
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie-card');
        movieEl.onclick = () => window.location.href = `movie.html?id=${id}`;
        movieEl.innerHTML = `
            <img src="${poster_path ? IMG_URL + poster_path : 'https://via.placeholder.com/500x750'}" alt="${title}">
            <div class="movie-info">
                <h3>${title}</h3>
                <span class="rating">★ ${vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
            </div>
        `;
        grid.appendChild(movieEl);
    });
}

if(searchBox) {
    searchBox.addEventListener('keyup', (e) => {
        currentSearchTerm = e.target.value;
        if(e.key === 'Enter') {
            currentPage = 1; selectedGenre = [];
            document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('active'));
            if(currentSearchTerm) {
                // UPDATE TITLE ON SEARCH
                if(genreTitle) genreTitle.innerHTML = `Search Results: <span class='highlight'>${currentSearchTerm}</span>`;
                
                getMovies(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentSearchTerm}`);
            } else {
                getMovies(`${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`);
            }
        }
    });
}

// DETAILS PAGE FUNCTIONS
let youtubeKey = '';

async function getMovieDetails(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
    const movie = await res.json();
    document.querySelector('.hero').style.backgroundImage = `linear-gradient(to right, #141414 50%, transparent), url(${ORIGINAL_IMG_URL + movie.backdrop_path})`;
    document.getElementById('title').innerText = movie.title;
    document.getElementById('tagline').innerText = movie.tagline || "";
    document.getElementById('overview').innerText = movie.overview || "No description available.";
    document.getElementById('date').innerText = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    document.getElementById('rate').innerText = `TMDB ${movie.vote_average.toFixed(1)}`;
    document.getElementById('runtime').innerText = `${movie.runtime} min`;
    document.getElementById('genres').innerText = movie.genres.map(g => g.name).join(', ');
    document.getElementById('poster3d').src = movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/300x450';
    document.getElementById('budget').innerText = movie.budget ? `$${movie.budget.toLocaleString()}` : 'N/A';
    document.getElementById('revenue').innerText = movie.revenue ? `$${movie.revenue.toLocaleString()}` : 'N/A';
    document.getElementById('status').innerText = movie.status;
    fetchVideo(id);
    getSimilarMovies(id);
}

async function getSimilarMovies(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}`);
    const data = await res.json();
    const container = document.getElementById('similarContainer');
    if(!container) return;
    container.innerHTML = '';
    data.results.slice(0, 10).forEach(movie => {
        const div = document.createElement('div');
        div.classList.add('cast-card'); 
        div.onclick = () => window.location.href = `movie.html?id=${movie.id}`;
        div.innerHTML = `<img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/150x225'}" alt="${movie.title}"><div class="similar-movie-title">${movie.title}</div>`;
        container.appendChild(div);
    });
}

async function getCast(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`);
    const data = await res.json();
    const container = document.getElementById('castContainer');
    if(!container) return;
    container.innerHTML = ''; 
    data.cast.slice(0, 10).forEach(actor => {
        const div = document.createElement('div');
        div.classList.add('cast-card');
        div.innerHTML = `<img src="${actor.profile_path ? IMG_URL + actor.profile_path : 'https://via.placeholder.com/100'}" alt="${actor.name}"><div class="cast-name">${actor.name}</div><div class="character-name">${actor.character}</div>`;
        container.appendChild(div);
    });
}

async function getReviews(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}/reviews?api_key=${API_KEY}`);
    const data = await res.json();
    const container = document.getElementById('reviewsContainer');
    if(!container) return;
    container.innerHTML = '';
    if(data.results.length === 0) { container.innerHTML = '<p style="color:#777; padding-left:20px;">No reviews yet.</p>'; return; }
    data.results.slice(0, 4).forEach(review => {
        const div = document.createElement('div');
        div.classList.add('review-card');
        div.innerHTML = `<div class="review-header"><span>${review.author}</span><span>★ ${review.author_details.rating || '-'}</span></div><div class="review-text">"${review.content}"</div>`;
        container.appendChild(div);
    });
}

function init3DPoster() {
    const container = document.querySelector('.hero');
    const poster = document.getElementById('poster3d');
    if(container && poster) {
        container.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            poster.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });
        container.addEventListener('mouseleave', () => { poster.style.transform = `rotateY(0deg) rotateX(0deg)`; });
    }
}

async function fetchVideo(id) {
    const res = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
    youtubeKey = trailer ? trailer.key : null;
}
function openTrailer() {
    const overlay = document.getElementById('videoOverlay');
    const videoContainer = document.getElementById('videoContainer');
    const errorMsg = document.getElementById('trailerError');
    
    if(overlay) overlay.classList.add('show');

    if(youtubeKey) {
        if(errorMsg) errorMsg.classList.add('hidden');
        if(videoContainer) {
            videoContainer.classList.remove('hidden');
            videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeKey}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        }
    } else {
        if(videoContainer) {
            videoContainer.classList.add('hidden');
            videoContainer.innerHTML = ''; 
        }
        if(errorMsg) errorMsg.classList.remove('hidden'); 
    }
}

function closeTrailer() {
    const overlay = document.getElementById('videoOverlay');
    const videoContainer = document.getElementById('videoContainer');
    
    if(overlay) overlay.classList.remove('show');
    if(videoContainer) videoContainer.innerHTML = '';
}