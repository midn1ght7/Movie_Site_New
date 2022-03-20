let url = window.location.href
var url_split = url.split('/')
let searchTerm = url_split[url_split.length-1];

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
}

async function appendMovie(data){
    const searchElement = document.createElement('div');
    searchElement.classList.add('search-item');
    searchElement.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    searchElement.innerHTML = `
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
    document.getElementById(`search-content`).appendChild(searchElement);
}

async function showSearch(){
    const response = await fetch(`/getSearch/${searchTerm}`,{method:'GET'});
    var data = await response.json();
    if(data){
        console.log(data);
        for (const movie of data){
            appendMovie(movie);
        }
    }
}


window.onload=function(){
    showSearch()
}   
