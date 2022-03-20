let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
}

async function appendMovie(data){
    const ratingElement = document.createElement('div');
    ratingElement.classList.add('ratings-item');
    ratingElement.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    ratingElement.innerHTML = `
    <div class="item-poster">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <div class="item-data">
        <a class="item-title" href="/details/${data.id}" title="${data.title}">
            <bdi>${styleTitle(data.title, data.release_date)}</bdi>
        </a>
        <span class="item-rating"><a><i class="fa fa-star"></i> </a>${data.user_rating}</span>
        <a class="item-overview">
            <bdi>${data.overview}</bdi>
        </a>
    </div>`;
    document.getElementById(`ratings-content`).appendChild(ratingElement);
}

async function showRatings(){
    const response = await fetch(`/getUserRatings2/${user_id}`,{method:'GET'});
    const user_ratings = await response.json();
    console.log(user_ratings);
    if(user_ratings.user_ratings.length > 0){
        for (const movie of user_ratings.user_ratings)
        {
            appendMovie(movie);
        }
        userRatings(user_ratings.user_ratings)
    }
}


window.addEventListener('load', function() {
    showRatings()
});
