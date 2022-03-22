let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-1];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    user_data = data;
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${data.username}`
    document.getElementById("date-joined").innerHTML=`Member since ${formatDate(data.date_joined)}`
}

async function userRatings(){
    const response = await fetch(`/getUserRatings/${user_id}`,{method:'GET'});
    const user_ratings = await response.json();
    console.log(user_ratings);
    if(user_ratings.user_ratings.length > 0){
        showUserRatings(user_ratings.user_ratings)
        userRecommendations();
    }
    else{
        htmlScrollers("user-ratings", `${user_data.username} haven't rated any movie yet.`, "ratings-scroller")
        htmlScrollers("recommended-user", `Here you will find recommended movies for ${user_data.username}.`, "recommendation-scroller")
    }
}

async function userWatchlist(){
    const response = await fetch(`/getUserWatchlist/${user_id}`,{method:'GET'});
    const user_data = await response.json();
    console.log(user_data);
    if(user_data.user_watchlist.length > 0){
        showUserWatchlist(user_data.user_watchlist)
    }
    else{
        htmlScrollers("user-watchlist", `${user_data.username} doesn't have any movie in watchlist.`, "watchlist-scroller")
    }
}

async function showUserRatings(user_ratings){
    htmlScrollers("user-ratings", ` ${user_data.username}'s most recently rated:`, "ratings-scroller")
    if (user_ratings.length > 10) {
        for (i = 0; i < 10; i++) {
            showRatingScroller(user_ratings[i], "ratings-scroller");
        }
    }
    else {
        for (const movie of user_ratings) {
            showRatingScroller(movie, "ratings-scroller");
        }
    }
    const show_moreEl = document.createElement('div');
    show_moreEl.classList.add('scroller-item-more');
    show_moreEl.setAttribute("onclick", `location.href='/user/${user_id}/ratings/all';`);
    show_moreEl.innerHTML = `
        <p class="movie-flex">
            <a class="title" title="See all ${user_ratings.length} ratings">
                <bdi>See all ${user_ratings.length} ratings</bdi>
            </a>
        </p>`;
    document.getElementById("user-ratings").appendChild(show_moreEl);
}

async function showUserWatchlist(user_watchlist){
    htmlScrollers("user-watchlist", ` ${user_data.username}'s most recent movies in watchlist:`, "watchlist-scroller")
    if (user_watchlist.length > 10) {
        for (i = 0; i < 10; i++) {
            showWatchlistScroller(user_watchlist[i], "watchlist-scroller");
        }
    }
    else {
        for (const movie of user_watchlist) {
            showWatchlistScroller(movie, "watchlist-scroller");
        }
    }
    const show_moreEl = document.createElement('div');
    show_moreEl.classList.add('scroller-item-more');
    show_moreEl.setAttribute("onclick", `location.href='/user/${user_id}/watchlist';`);
    show_moreEl.innerHTML = `
        <p class="movie-flex">
            <a class="title" title="See all ${user_watchlist.length} ratings">
                <bdi>See whole watchlist (${user_watchlist.length})</bdi>
            </a>
        </p>`;
    document.getElementById("user-watchlist").appendChild(show_moreEl);
}

async function userRecommendations(){
    htmlScrollers("recommended-user", `Recommended for ${user_data.username} based on similar users:`, "recommendation-scroller")
    const response = await fetch(`/getUserRecommendations/${user_id}`,{method:'GET'});
    const responseJSON = await response.json();
    for (const movie of responseJSON){
        showRecommendationScroller(movie, "recommendation-scroller")
    }
}

function styleTitle(title){
    if(title.length > 19)
    {
        title = title.substring(0, 19);
        title = title + "...";
    }
    return title;
}

function formatDate(date){
    console.log(date);
    year = date.substring(0, 4)
    month = date.substring(5,7)
    day = date.substring(8,10)
    return `${day}.${month}.${year}`
}
function htmlScrollers(div_to_append, h3_text, div2_id){
    let h3 = document.createElement('h3'); 
    h3.textContent = h3_text;
    let div1 = document.createElement('div');
    div1.className = "user-scroller";
    let div2 = document.createElement('div');
    div2.className = "scroller";
    div2.id = div2_id;
    div1.appendChild(div2);
    document.getElementById(`${div_to_append}`).appendChild(h3);
    document.getElementById(`${div_to_append}`).appendChild(div1);
}


function showRatingScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`location.href='/details/${data.id}';`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" title="${data.title}">
            ${styleTitle(data.title)}
        </a>
        <span class="rating"><a><i class="fa fa-star"></i> </a>${data.user_rating}</span>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}

function showWatchlistScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`location.href='/details/${data.id}';`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" title="${data.title}">
            ${styleTitle(data.title)}
        </a>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}

function showRecommendationScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`location.href='/details/${data.id}';`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" title="${data.title}">
            ${styleTitle(data.title)}
        </a>
        <span class="rating"><a><i class="fa fa-percent"></i> </a>${parseInt(data.shared_by_percentage)}</span>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}


window.addEventListener('load', async function() {
    await userData();
    userWatchlist();
    userRatings();
});