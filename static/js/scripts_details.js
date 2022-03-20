//TMDB

const API_KEY = 'api_key=8cc7b14fbd7e6745695ae4dd54391660';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces';
const SEARCH_URL = BASE_URL+'/search/movie?'+API_KEY;
const LANG = '&language=en-US';

const POPULAR = BASE_URL+ '/discover/tv?'+API_KEY+'&sort_by=popularity.desc&';
const EXAMPLE = BASE_URL + '/movie/550?'+API_KEY+'&query=';

var url = window.location.pathname;
var id = url.substring(9);
//alert(id);

function getColor(vote){
    if(vote>=7)
    {
        return 'green';
    }
    else if(vote>= 3){
        return 'orange';
    }
    else{
        return 'red';
    }
}

function formatReleaseDate(rd)
{
    rd = rd.substring(0,4);
    rd = '('+rd+')';
    return rd;
}

function formatGenres(genres)
{
    var genres_string = "";
    genres.forEach(genre =>{
        //alert(genre.name);
        genres_string += genre.name + ', ';
    })
    //alert(genres);
    genres_string = genres_string.substring(0, genres_string.length-2);
    return genres_string;
}

function showMovieDetails()
{
    fetch(`/get_movie/${id}`).then(response => response.json()).then(data =>
    {
        data = data[0]
        document.getElementById("poster").src=`/${data.poster}`;
        document.getElementById("a-title").text=`${data.title}`;
        document.getElementById("movie-details-background").style.backgroundImage = `url(/${data.backdrop})`;
        document.getElementById("span-release-date").innerHTML = formatReleaseDate(data.release_date);
        document.getElementById("rating").innerHTML = data.vote_average;
        document.getElementById("rating").className = `${getColor(data.vote_average)}`;
        document.getElementById("a-genres").text=`${formatGenres(data.genres)}`;
        document.getElementById("details-overview").innerHTML = `<h3>Overview</h3>
        ${data.overview}`;
        moreMovieDetails(data);
        getSimilar();
    })
}
showMovieDetails();

function moreMovieDetails(data){
    if(data.original_title){
        let h3 = document.createElement('h3');
        h3.textContent = "Original Title"
        document.getElementById("original_title").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.original_title;
        document.getElementById("original_title").appendChild(p);
    }
    if(data.tagline){
        let h3 = document.createElement('h3');
        h3.textContent = "Tagline"
        document.getElementById("tagline").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.tagline;
        document.getElementById("tagline").appendChild(p);
    }
    if(data.status){
        let h3 = document.createElement('h3');
        h3.textContent = "Status"
        document.getElementById("status").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.status;
        document.getElementById("status").appendChild(p);
    }
    if(data.keywords)
    {
        let ul = document.createElement('ul');
        let h3 = document.createElement('h3');
        data.keywords.keywords.forEach(keyword => {
            //console.log(keyword.name);
            
            let li = document.createElement('li');
            li.innerHTML= `<a class="rounded">${keyword.name}</a>`
            ul.appendChild(li);
        })
        h3.textContent = "Keywords"
        document.getElementById("keywords").appendChild(h3);
        document.getElementById("keywords").appendChild(ul);
    }
}

function styleTitle(title){
    if(title.length > 24)
    {
        title = title.substring(0, 24);
        title = title + "...";
    }
    return title;
}

async function getSimilar()
{
    const response = await fetch(`/get_similar/${id}`,{method:'GET'});
    const responseJSON = await response.json();
    console.log(responseJSON);
    responseJSON.forEach(item => {
        showRecommendations(item);
    })
}

function showRecommendations(data){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="backdrop" src="/${data.backdrop}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" href="/details/${data.id}" title="${data.title}">
            <bdi>${styleTitle(data.title)}</bdi>
        </a>
        <span class="vote_average">${data.vote_average}</span>
    </p>`;
    document.getElementById("scroller").appendChild(movieEl);
}
