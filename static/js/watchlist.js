let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${data.username}'s watchlist:`
}

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
}

async function appendMovie(data){
    const ratingElement = document.createElement('div');
    ratingElement.classList.add('watchlist-item');
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
        <a class="item-overview">
            <bdi>${data.overview}</bdi>
        </a>
    </div>`;
    document.getElementById(`watchlist-content`).appendChild(ratingElement);
}

async function showWatchlist(){
    const response = await fetch(`/getUserWatchlist/${user_id}`,{method:'GET'});
    const user_data = await response.json();
    console.log(user_data);
    if(user_data.user_watchlist.length > 0){
        for (const movie of user_data.user_watchlist)
        {
            appendMovie(movie);
        }
    }
}


window.addEventListener('load', function() {
    userData();
    showWatchlist();
});
