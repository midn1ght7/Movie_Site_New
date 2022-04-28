
var url = window.location.pathname;
var url_split = url.split('/')
var id = url_split[url_split.length-1];
var tmdb_id = null;
var user_id = null;

function getColor(vote){
    if(vote>=7)
    {
        return 'green';
    }
    else if(vote>=3){
        return 'orange';
    }
    else if(vote<3) {
        return 'red';
    }
    else {
        return 'white'
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

function styleTitle(title){
    if(title.length > 24)
    {
        title = title.substring(0, 24);
        title = title + "...";
    }
    return title;
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
        document.getElementById("a-genres").text=`${formatGenres(data.genres)}`;
        document.getElementById("details-overview").innerHTML = `<h3>${gettext('overview')}</h3>
        ${data.overview}`;
        moreMovieDetails(data);
    }
}


function moreMovieDetails(data){
    if(data.original_title){
        let h3 = document.createElement('h3');
        h3.textContent = gettext("original-title");
        document.getElementById("original_title").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.original_title;
        document.getElementById("original_title").appendChild(p);
    }
    if(data.director){
        let h3 = document.createElement('h3');
        h3.textContent =  gettext("director");
        document.getElementById("director").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.director;
        document.getElementById("director").appendChild(p);
    }
    if(data.tagline){
        let h3 = document.createElement('h3');
        h3.textContent = gettext("tagline");
        document.getElementById("tagline").appendChild(h3);
        let p = document.createElement('p');
        p.textContent = data.tagline;
        document.getElementById("tagline").appendChild(p);
    }
    if(data.status){
        let h3 = document.createElement('h3');
        h3.textContent = gettext("status_");
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
        h3.textContent = gettext("keywords");
        document.getElementById("keywords").appendChild(h3);
        document.getElementById("keywords").appendChild(ul);
    }
}

async function getSimilar()
{
    const response = await fetch(`/get_similar/${id}`,{method:'GET'});
    const responseJSON = await response.json();
    console.log("Content-based Recommendation response:",responseJSON);
    if (responseJSON.length !== 0){

        htmlRecommendations(gettext("content-recommendation"), "scroller-sim");
        responseJSON.forEach(item => {
            showScroller(item, "scroller-sim");
        })
    }
    else{
        console.log("/get_similar returned an empty array");
    }
}

async function collabRecommendation()
{
    let before = Date.now()
    const response = await fetch(`/collabRecommendation/${tmdb_id}`,{method:'GET'});
    const responseJSON = await response.json();
    let after = Date.now();
    let time = after - before;
    console.log("It took",time,"to execute collab");
    console.log("Collaborative Recommendation response:",responseJSON);
    if (responseJSON.length !== 0){
        htmlRecommendations(gettext("collab-recommendation"), "scroller-rec");
        responseJSON.forEach(item => {
            showScroller(item, "scroller-rec");
        })
    }
    else{
        console.log("/collabRecommendation returned an empty array");
        let div = document.createElement("div");
        div.className = "recommendations-empty"
        div.innerHTML = `<h3>${gettext('collab-recommendation-not-enough')}</h3>`
        document.getElementById('recommendations').appendChild(div);
    }
}

async function checkUserWatchlist(){
    const response = await fetch(`/checkIfInWatchlist/${tmdb_id}`,{method:'GET'});
    const data = await response.json();
    console.log("User Watchlist:",data);
    //console.log(data.user_ratings);
    if(data.user_id!="null")
    {
        if (data.in_watchlist == true) {
            document.getElementById("sp_watchlist").innerHTML = `<i class="fa fa-bookmark" title='${gettext('movie-in-watchlist')}'></i>`;
        }
        else{
            document.getElementById("sp_watchlist").innerHTML = `<i class="fa fa-bookmark-o" title='${gettext('movie-not-in-watchlist')}'></i>`;
        }
    }
}

async function addToWatchlist() {
    const response = await fetch(`../addToWatchlist/${user_id}/${tmdb_id}`,{method:"POST"});
    if (response.ok){
        const data = await response.json();
        console.log(data);
    }
    else {
        throw new Error("Error fetching: " + item);
    }
    checkUserWatchlist()
}

async function checkUserLists(){
    const response = await fetch(`/getUserLists/${user_id}`,{method:'GET'});
    const data = await response.json();
    console.log("User Lists:",data);
    document.getElementById('modal-list').innerHTML = ``;
    //console.log(data.user_ratings);
    if (data.user_lists.length > 0) { 
        for (const list of data.user_lists) {
            let list_div = document.createElement('div');
            list_div.className = "list-item";
            list_div.onclick = async function(){
                const response = await fetch(`../addToList/${user_id}/${tmdb_id}/${list.id}`,{method:'POST'});
                const data = await response.json();
                console.log("addToList:",data);
                checkUserLists();
            };
            list_div.innerHTML = `<a><i class="fa fa-plus" aria-hidden="true"></i> ${list.name}</a>`
            for (const movie of list.movies) {
                if(movie.tmdb_id == tmdb_id){
                    list_div.innerHTML = `<a><i class="fa fa-minus" aria-hidden="true"></i> ${list.name}</a>`
                    break;
                }
            }
            document.getElementById("modal-list").appendChild(list_div);
        }
    }
    else {
        let p = document.createElement('p');
        p.innerHTML = "You don't have any list created."
        document.getElementById("modal-list").appendChild(p);
    }
    let create_div = document.createElement('div');
    create_div.className = "list-item";
    create_div.setAttribute("onclick", `location.href='/list/create';`);
    create_div.innerHTML = `<a>${gettext('create-list')}</a>`;
    document.getElementById("modal-list").appendChild(create_div);
}

async function checkUserRating(){
    const response = await fetch(`/getRating/${tmdb_id}`,{method:'GET'});
    const data = await response.json();
    console.log("User Rating:",data);
    if(data.user_id!="null")
    {
        if (data.user_rating == "null") {
            document.getElementById("sp_yourrating").innerHTML = '<i class="fa fa-star-o"></i>';
        }
        else{
            document.getElementById("sp_yourrating").innerHTML = data.user_rating;
            document.getElementById("sp_yourrating").className = `${getColor(data.user_rating)}`;
        }
    }
}

async function postRating(rating){
    const response = await fetch(`../addRating/${tmdb_id}/${rating}`,{method:'POST'});
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

async function removeRating() {
    const response = await fetch(`../removeRating/${tmdb_id}`, { method: 'POST' });
    if (response.ok) {
        document.getElementById('myModal').className = "Modal is-hidden is-visuallyHidden";
        document.getElementsByTagName('body').className = "";
        document.getElementById('main').className = "MainContainer";
        document.getElementById('main').parentElement.className = "";
    }
    else {
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
            ${styleTitle(data.title)}
        </a>
        <span class="vote_average">${data.vote_average}</span>
    </p>
    <a class="title"">
    ${gettext('similarity')}: ${Math.round((1-data.similarity_score)*100)} %
    </a>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}


window.addEventListener('load', async function() {
    await showMovieDetails();
    getSimilar();
    collabRecommendation();

    // Get the modal
    var ratingModal = document.getElementById('myModal');
    var listModal = document.getElementById('listModal');
    // Get the main container and the body
    var body = document.getElementsByTagName('body');
    var container = document.getElementById('main');

    // Get User Stuff
    if (document.getElementById('user_id')!=null){
        user_id = document.getElementById('user_id').innerHTML;
        checkUserRating();
        checkUserWatchlist();
        document.getElementById("sp_watchlist").onclick = function (){
            addToWatchlist()
        }
        checkUserLists();
    }

    if(document.getElementById('sp_yourrating') !== null)
    {
        document.getElementById("sp_yourrating").onclick = function() {
            ratingModal.className = "Modal is-visuallyHidden";
            setTimeout(function() {
            container.className = "MainContainer is-blurred";
            ratingModal.className = "Modal";
            }, 100);
            container.parentElement.className = "ModalOpen";
        }
    }

    if(document.getElementById('sp_list') !== null)
    {
        document.getElementById("sp_list").onclick = function() {
            listModal.className = "Modal is-visuallyHidden";
            setTimeout(function() {
            container.className = "MainContainer is-blurred";
            listModal.className = "Modal";
            }, 100);
            container.parentElement.className = "ModalOpen";
        }
    }

    // Close the modal
    document.getElementById("closeRatingModal").onclick = function(){
        ratingModal.className = "Modal is-hidden is-visuallyHidden";
        body.className = "";
        container.className = "MainContainer";
        container.parentElement.className = "";
    }

    document.getElementById("closeListModal").onclick = function(){
        listModal.className = "Modal is-hidden is-visuallyHidden";
        body.className = "";
        container.className = "MainContainer";
        container.parentElement.className = "";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == ratingModal) {
            ratingModal.className = "Modal is-hidden";
            body.className = "";
            container.className = "MainContainer";
            container.parentElement.className = "";
        }
        if (event.target == listModal) {
            listModal.className = "Modal is-hidden";
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
});

