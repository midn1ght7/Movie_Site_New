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
var user_id = null;
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
        console.log("TMDB_ID of selected movie:",tmdb_id)
        document.getElementById("poster").src=`/${data.poster}`;
        document.getElementById("a-title").text=`${data.title}`;
        document.getElementById("movie-details-background").style.backgroundImage = `url(/${data.backdrop})`;
        document.getElementById("span-release-date").innerHTML = formatReleaseDate(data.release_date);
        document.getElementById("sp_tmdbrating").innerHTML = data.vote_average;
        document.getElementById("sp_tmdbrating").className = `${getColor(data.vote_average)}`;
        if(document.getElementById('sp_yourrating') !== null)
        {
            checkUserRating();
        }
        if(document.getElementById('sp_watchlist') !== null){
            checkUserWatchlist();
            document.getElementById("sp_watchlist").onclick = function (){
                addToWatchlist()
            }
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
            li.innerHTML= `<a class="rounded" href="/keyword/${keyword.name}">${keyword.name}</a>`
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
    console.log("Content-based Recommendation response:",responseJSON);
    if (responseJSON.length !== 0){
        htmlRecommendations("Content-based recommendation", "scroller-sim");
        responseJSON.forEach(item => {
            showScroller(item, "scroller-sim");
        })
    }
    else{
        console.log("/collabRecommendation returned an empty array");
    }
}

async function collabRecommendation()
{
    const response = await fetch(`/collabRecommendation/${tmdb_id}`,{method:'GET'});
    const responseJSON = await response.json();
    console.log("Collaborative Recommendation response:",responseJSON);
    if (responseJSON.length !== 0){
        htmlRecommendations("Collaborative recommendation", "scroller-rec");
        responseJSON.forEach(item => {
            showScroller(item, "scroller-rec");
        })
    }
    else{
        console.log("/collabRecommendation returned an empty array");
        let div = document.createElement("div");
        div.className = "recommendations-empty"
        div.innerHTML = `<h3>There is not enough ratings for this movie in the database to create Collaborative Recommendations.</h3>`
        document.getElementById('recommendations').appendChild(div);
    }
}

async function checkUserWatchlist(){
    const response = await fetch(`/checkIfInWatchlist/${tmdb_id}`,{method:'GET'});
    const data = await response.json();
    console.log(data);
    //console.log(data.user_ratings);
    if(data.user_id!="null")
    {
        user_id = data.user_id;
        if (data.in_watchlist == true) {
            document.getElementById("sp_watchlist").innerHTML = "Remove from watchlist";
        }
        else{
            document.getElementById("sp_watchlist").innerHTML = "Add to watchlist";
        }
    }
}

async function addToWatchlist() {
    const response = await fetch(`/addToWatchlist/${user_id}/${tmdb_id}`,{method:'POST'});
    if (response.ok){
        const data = await response.json();
        console.log(data);
    }
    else {
        throw new Error("Error fetching: " + item);
    }
    checkUserWatchlist()
}

async function checkUserRating(){
    const response = await fetch(`/getRating/${tmdb_id}`,{method:'GET'});
    const data = await response.json();
    console.log(data);
    if(data.user_id!="null")
    {
        user_valid = true;
        user_id = data.user_id;
        if (data.user_rating == "null") {
            document.getElementById("sp_yourrating").innerHTML = "Rate";
        }
        else{
            document.getElementById("sp_yourrating").innerHTML = data.user_rating;
            document.getElementById("sp_yourrating").className = `${getColor(data.user_rating)}`;
        }
    }
}

async function postRating(rating){
    const response = await fetch(`/addRating/${tmdb_id}/${rating}`,{method:'POST'});
    if (response.ok){
        document.getElementById('myModal').className = "Modal is-hidden is-visuallyHidden";
        document.getElementsByTagName('body').className = "";
        document.getElementById('main').className = "MainContainer";
        document.getElementById('main').parentElement.className = "";
    }
    else{
        throw new Error("Error fetching");
    }
    checkUserRating();
}

function htmlRecommendations(h3_text, div2_id){
    let h3 = document.createElement('h3'); 
    h3.textContent = h3_text;
    let div1 = document.createElement('div');
    div1.className = "recommendations-scroller";
    let div2 = document.createElement('div');
    div2.className = "scroller";
    div2.id = div2_id;
    div1.appendChild(div2);
    document.getElementById('recommendations').appendChild(h3);
    document.getElementById('recommendations').appendChild(div1);
}

function showScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`location.href='/details/${data.id}';`);
    movieEl.innerHTML = `
    <div class="image_content">
        <a title="${data.title}">
            <img loading="lazy" class="backdrop" src="/${data.backdrop}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" title="${data.title}">
            <bdi>${styleTitle(data.title)}</bdi>
        </a>
        <span class="vote_average">${data.vote_average}</span>
    </p>
    <a class="title"">
    Distance: ${Math.round(data.similarity_score*1000)/1000}
    </a>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}


window.addEventListener('load', function() {
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
    document.getElementById('rate-remove').onclick = function(){
        removeRating()
    }



    function removeRating(){
        if(user_valid==true){
            console.log("USER VALID!");
            fetch(`/removeRating/${tmdb_id}`).then((response) => {
                if (response.ok) {
                    modalClose()
                    return response.json();
                }
                else{
                    throw new Error("Error fetching: "+item);
                }
            })
            checkUserRating();
        }
        else{
            console.log("USER INVALID!");
        }
    }
});

