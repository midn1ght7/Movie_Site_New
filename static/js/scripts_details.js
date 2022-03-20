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
var tmdb_id = null;
var user_valid = false;

function getColor(vote){
    if(vote>=7)
    {
        return 'green';
    }
    else if(vote>= 3){
        return 'orange';
    }
    else if(vote<3) {
        return 'red';
    }
    else {
        return
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

async function showMovieDetails()
{
    const response = await fetch(`/get_movie/${id}`,{method:'GET'});
    var data = await response.json();
    if(data){
        data = data[0]
        console.log(data);
        tmdb_id = data.tmdb_id;
        console.log(tmdb_id)
        document.getElementById("poster").src=`/${data.poster}`;
        document.getElementById("a-title").text=`${data.title}`;
        document.getElementById("movie-details-background").style.backgroundImage = `url(/${data.backdrop})`;
        document.getElementById("span-release-date").innerHTML = formatReleaseDate(data.release_date);
        document.getElementById("sp_tmdbrating").innerHTML = data.vote_average;
        document.getElementById("sp_tmdbrating").className = `${getColor(data.vote_average)}`;
        if(document.getElementById('sp_yourrating') !== null)
        {
            let userRatingResponse = await checkUserRating();
            console.log("userRatingResponse:", userRatingResponse);
            document.getElementById("sp_yourrating").innerHTML = userRatingResponse;
            document.getElementById("sp_yourrating").className = `${getColor(userRatingResponse)}`;
        }
        document.getElementById("a-genres").text=`${formatGenres(data.genres)}`;
        document.getElementById("details-overview").innerHTML = `<h3>Overview</h3>
        ${data.overview}`;
        moreMovieDetails(data);
        getSimilar();
        collabRecommendation();
    }
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
    if(data.director){
        let h3 = document.createElement('h3');
        h3.textContent = "Director"
        document.getElementById("director").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.director;
        document.getElementById("director").appendChild(p);
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
        showScroller(item, "scroller-sim");
    })
}

async function collabRecommendation()
{
    const response = await fetch(`/collabRecommendation/${tmdb_id}`,{method:'GET'});
    const responseJSON = await response.json();
    console.log(responseJSON);
    responseJSON.forEach(item => {
        showScroller(item, "scroller-rec");
    })
}


async function checkUserRating(){
    const response = await fetch(`/getRating/${tmdb_id}`,{method:'GET'});
    const data = await response.json();
    console.log(data);
    //console.log(data.user_ratings);
    if(data.user_id!="null")
    {
        user_valid = true;
    }
    if (data.user_rating == "null") {
        return "Rate"
    }
    else{
        return data.user_rating;
    }
}

function showScroller(data, appendto){
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
    document.getElementById(`${appendto}`).appendChild(movieEl);
}


window.onload = function() {
    // Get the modal
    var modal = document.getElementById('myModal');
    // Get the main container and the body
    var body = document.getElementsByTagName('body');
    var container = document.getElementById('main');
    if(document.getElementById('sp_yourrating') !== null)
    {
        document.getElementById("sp_yourrating").onclick = function() {
            modal.className = "Modal is-visuallyHidden";
            setTimeout(function() {
            container.className = "MainContainer is-blurred";
            modal.className = "Modal";
            }, 100);
            container.parentElement.className = "ModalOpen";
        }
    }
    // Get the close button
    var btnClose = document.getElementById("closeModal");
    // Close the modal
    btnClose.onclick = modalClose

    function modalClose(){
        modal.className = "Modal is-hidden is-visuallyHidden";
        body.className = "";
        container.className = "MainContainer";
        container.parentElement.className = "";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.className = "Modal is-hidden";
            body.className = "";
            container.className = "MainContainer";
            container.parentElement.className = "";
        }
    }

    document.getElementById('rate-1').onclick = function(){
        postRating(1)
    }
    document.getElementById('rate-2').onclick = function(){
        postRating(2)
    }
    document.getElementById('rate-3').onclick = function(){
        postRating(3)
    }
    document.getElementById('rate-4').onclick = function(){
        postRating(4)
    }
    document.getElementById('rate-5').onclick = function(){
        postRating(5)
    }
    document.getElementById('rate-6').onclick = function(){
        postRating(6)
    }
    document.getElementById('rate-7').onclick = function(){
        postRating(7)
    }
    document.getElementById('rate-8').onclick = function(){
        postRating(8)
    }
    document.getElementById('rate-9').onclick = function(){
        postRating(9)
    }
    document.getElementById('rate-10').onclick = function(){
        postRating(10)
    }

    function postRating(rating){
        if(user_valid==true){
            console.log("USER VALID!");
            fetch(`/addRating/${tmdb_id}/${rating}`).then((response) => {
                if (response.ok) {
                    modalClose()
                    return response.json();
                }
                else{
                    throw new Error("Error fetching: "+item);
                }
            })
            location.reload();
        }
        else{
            console.log("USER INVALID!");
        }
    }
}

