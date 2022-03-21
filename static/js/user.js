let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;
let rated_movies = []

async function checkUser(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    //console.log(data);
    return data;
}

async function userRatings(user_ratings){
    htmlScrollers("user-ratings", "Your Ratings", "ratings-scroller")
    if (user_ratings.length > 10) {
        for (i = 0; i < 10; i++) {
            showRatingScroller(user_ratings[i], "ratings-scroller");
        }
        const show_moreEl = document.createElement('div');
        show_moreEl.classList.add('scroller-item-more');
        show_moreEl.setAttribute("onclick", ``);
        show_moreEl.innerHTML = `
            <p class="movie-flex">
                <a class="title" href="/user/${user_id}/ratings" title="See all ${user_ratings.length} ratings">
                    <bdi>See all ${user_ratings.length} ratings</bdi>
                </a>
            </p>`;
        document.getElementById("user-ratings").appendChild(show_moreEl);
    }
    else {
        for (const movie of user_ratings) {
            showRatingScroller(movie, "ratings-scroller");
        }
    }
}

async function userRecommendations(){
    htmlScrollers("recommended-user", "Recommended for You based on similar users", "recommendation-scroller")
    const response = await fetch(`/getUserRecommendations/${user_id}`,{method:'GET'});
    const responseJSON = await response.json();
    for (const movie of responseJSON){
        showRecommendationScroller(movie, "recommendation-scroller")
    }

}

async function showUserInfo(){
    user_data = await checkUser();
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${user_data.username}`
    document.getElementById("date-joined").innerHTML=`Member since ${formatDate(user_data.date_joined)}`
    const response = await fetch(`/getUserRatings/${user_id}`,{method:'GET'});
    const user_ratings = await response.json();
    console.log(user_ratings);
    if(user_ratings.user_ratings.length > 0){
        userRatings(user_ratings.user_ratings)
        userRecommendations();
    }
    else{
        htmlScrollers("user-ratings", "You haven't rated any movie yet.", "ratings-scroller")
        htmlScrollers("recommended-user", "Here you will find recommended movies just for you.", "recommendation-scroller")
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
    //console.log(date);
    year = date.substring(0, 4)
    //console.log(year);
    month = date.substring(5,7)
    //console.log(month)
    return `${month}.${year}`
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
    movieEl.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" href="/details/${data.id}" title="${data.title}">
            <bdi>${styleTitle(data.title)}</bdi>
        </a>
        <span class="rating"><a><i class="fa fa-star"></i> </a>${data.user_rating}</span>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}

function showRecommendationScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" href="/details/${data.id}" title="${data.title}">
            <bdi>${styleTitle(data.title)}</bdi>
        </a>
        <span class="rating"><a><i class="fa fa-percent"></i> </a>${parseInt(data.shared_by_percentage)}</span>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}

window.onload = function() {
    
    showUserInfo();
}
