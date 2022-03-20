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
        getSimilar();
    })
}
showMovieDetails();

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
}

/*
async function getRecommendations()
{
    const response = await fetch(`/get_recommendations/${id}`,{method:'GET'});
    const responseJSON = await response.json();
    //console.log(responseJSON);
    var newData = responseJSON[0];
    var array = [];
    for (var i in newData)
    {
        array.push([newData[i]]);
    }
    //console.log(array);
    array.forEach(item => {
        fetch(BASE_URL+'/movie/'+item+'?'+API_KEY+LANG).then(response => response.json()).then(data =>{
            console.log(data);
            showRecommendations(data);
        }) 
    })
}

getRecommendations();

function showRecommendations(data){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="backdrop" src="${BACKDROP_URL+data.backdrop_path}">
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
*/