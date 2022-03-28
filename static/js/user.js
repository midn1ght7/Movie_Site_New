let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-1];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    user_data = data;
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${data.username}`;
    document.getElementById("date-joined").innerHTML=`${gettext('member-since')}: ${formatDate(data.date_joined)}`;
}

async function userRatings(){
    const response = await fetch(`/getUserRatings/${user_id}`,{method:'GET'});
    const data = await response.json();
    console.log("User ratings:",data);
    if(data.user_ratings.length > 0){
        showUserRatings(data.user_ratings)
        userRecommendations();
    }
    else{
        htmlScrollers("user-ratings", `${user_data.username} ${gettext('no-movies-ratings')}`, "ratings-scroller")
        htmlScrollers("recommended-user", `${gettext('no-movies-ratings-recommendations')} ${user_data.username}.`, "recommendation-scroller")
    }
}

async function userWatchlist(){
    const response = await fetch(`/getUserWatchlist/${user_id}`,{method:'GET'});
    const data = await response.json();
    console.log("User watchlist:",data);
    if(data.user_watchlist.length > 0){
        showUserWatchlist(data.user_watchlist)
    }
    else{
        htmlScrollers("user-watchlist", `${user_data.username} ${gettext('no-movies-watchlist')}`, "watchlist-scroller")
    }
}

async function userLists(){
    const response = await fetch(`/getUserLists/${user_id}`,{method:'GET'});
    const data = await response.json();
    console.log("User lists:",data);
    if(data.user_lists.length > 0){
        showUserLists(data.user_lists);
    }
    else{
        htmlScrollers("user-lists", `${user_data.username} ${gettext('no-lists')}`, "lists-rows")
    }
}

async function showUserRatings(user_ratings){
    htmlScrollers("user-ratings", `${gettext('recently-rated')} ${user_data.username}:`, "ratings-scroller")
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
    show_moreEl.setAttribute("onclick", `location.href='/user/${user_id}/ratings';`);
    show_moreEl.innerHTML = `
        <p class="movie-flex">
            <a class="title" title="${gettext('see-all-ratings')} (${user_ratings.length})">
            ${gettext('see-all-ratings')} (${user_ratings.length})
            </a>
        </p>`;
    document.getElementById("user-ratings").appendChild(show_moreEl);
}

async function showUserWatchlist(user_watchlist){
    htmlScrollers("user-watchlist", `${gettext('user-watchlist')} ${user_data.username}:`, "watchlist-scroller")
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
            <a class="title" title="${gettext('see-watchlist')} (${user_watchlist.length})">
            ${gettext('see-watchlist')} (${user_watchlist.length})
            </a>
        </p>`;
    document.getElementById("user-watchlist").appendChild(show_moreEl);
}

async function showUserLists(user_lists){
    htmlRows("user-lists", `${gettext('user-lists')} ${user_data.username}:`, "lists-rows")
    if (user_lists.length > 5) {
        for (i = 0; i < 5; i++) {
            showListsRows(user_lists[i], "lists-rows");
        }
    }
    else {
        for (const list of user_lists) {
            showListsRows(list, "lists-rows");
        }
    }
    const show_moreEl = document.createElement('div');
    show_moreEl.classList.add('scroller-item-more');
    show_moreEl.setAttribute("onclick", `location.href='/user/${user_id}/lists';`);
    show_moreEl.innerHTML = `
        <p class="movie-flex">
            <a class="title" title="${gettext('see-lists')} (${user_lists.length})">
            ${gettext('see-lists')} (${user_lists.length})
            </a>
        </p>`;
    document.getElementById("user-lists").appendChild(show_moreEl);
}

async function userRecommendations(){
    htmlScrollers("recommended-user", `${gettext('user-recommendation-1')} ${user_data.username} ${gettext('user-recommendation-2')}:`, "recommendation-scroller")
    const response = await fetch(`/getUserRecommendations/${user_id}`,{method:'GET'});
    const responseJSON = await response.json();
    for (const movie of responseJSON){
        showRecommendationScroller(movie, "recommendation-scroller")
    }
}

function styleTitle(title){
    if(title.length > 19)
    {
        title = title.substring(0, 16);
        title = title + "...";
    }
    return title;
}

function formatDate(date){
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

function htmlRows(div_to_append, h3_text, div2_id){
    let h3 = document.createElement('h3'); 
    h3.textContent = h3_text;
    let div1 = document.createElement('div');
    div1.className = "user-rows";
    let div2 = document.createElement('div');
    div2.className = "rows";
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

function showListsRows(data, appendto){
    if(data.movies.length > 0){
        const Element = document.createElement('div');
        Element.classList.add('list-item');
        let overview = `${data.movies.length} ${gettext('list-titles')}`
        lastDigit = parseInt(data.movies.length.toString().slice(-1))
        if(lastDigit == 2 || lastDigit == 3 || lastDigit == 4){
            overview = `${data.movies.length} ${gettext('list-titles-alt')}`
        }
        if(data.movies.length == 1){
            overview = `${data.movies.length} ${gettext('list-title')}`
        }
        Element.innerHTML = `
            <div class="item-poster">
                <a href="/user/${user_id}/list/${data.id}" title="${data.name}">
                    <img loading="lazy" class="poster" src="/${data.movies[0].poster}">
                </a>
            </div>
            <div class="item-data">
                <a class="item-title" href="/user/${user_id}/list/${data.id}" title="${data.name}">
                    ${data.name}
                </a>
                <a class="item-overview">
                    ${overview}
                </a>
            </div>`;
        document.getElementById(`${appendto}`).appendChild(Element);
    }
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
    userLists();
});