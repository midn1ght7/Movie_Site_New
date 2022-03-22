let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-3];
let list_id = url_split[url_split.length-1];
let user_data = null;
let list_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    user_data = data;
}

async function listData(){
    const response = await fetch(`/getList/${list_id}`,{method:'GET'});
    const data = await response.json();
    list_data = data;
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${user_data.username}'s list: ${list_data.name}`
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

async function showList(){
    if (list_data.movies.length > 0){
        for (const movie of list_data.movies)
        {
            appendMovie(movie);
        }
    }
}


window.addEventListener('load', async function() {
    await userData();
    await listData();
    showList();
});
