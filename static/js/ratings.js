let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    document.getElementById("username").innerHTML=`${gettext('user-ratings')} <a class='profile-href' href='/user/${data.user_id}'><i class="fa fa-user"></i> ${data.username}</a>:`
}

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
}

function formatDate(date){
    console.log(date);
    year = date.substring(0, 4)
    month = date.substring(5,7)
    day = date.substring(8,10)
    return `${day}.${month}.${year}`
}

function formatOverview(overview){
    if(overview.length > 495)
    {
        overview = overview.substring(0, 492);
        overview = overview + "...";
    }
    return overview;
}

async function appendMovie(data){
    const ratingElement = document.createElement('div');
    ratingElement.classList.add('ratings-item');   
    ratingElement.innerHTML = `
    <div class="item-poster">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <div class="item-data">
        <a class="item-title" href="/details/${data.id}" title="${data.title}">
            ${styleTitle(data.title, data.release_date)}
        </a>
        <span class="item-rating"><a><i class="fa fa-star"></i> </a>${data.user_rating}</span>
        <a class="item-timestamp">${gettext('rated-on')}: ${formatDate(data.user_rating_timestamp)}</a>
        <a class="item-overview">
            ${formatOverview(data.overview)}
        </a>
    </div>`;
    document.getElementById(`ratings-content`).appendChild(ratingElement);
}

async function showRatings(){
    const response = await fetch(`/getUserRatings/${user_id}`,{method:'GET'});
    const user_ratings = await response.json();
    console.log(user_ratings);
    if(user_ratings.user_ratings.length > 0){
        for (const movie of user_ratings.user_ratings)
        {
            appendMovie(movie);
        }
    }
}


window.addEventListener('load', function() {
    userData();
    showRatings();
});
