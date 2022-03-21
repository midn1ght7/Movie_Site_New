let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-3];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${data.username}'s ratings:`
}

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
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
        <a class="item-overview">
            ${data.overview}
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