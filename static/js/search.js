let url = window.location.href
var url_split = url.split('/')
let searchTerm = url_split[url_split.length-1];

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
}

async function appendMovie(data){
    if (data.title && data.release_date != null){
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
                ${styleTitle(data.title, data.release_date)}
            </a>
            <a class="item-overview">
                ${data.overview}
            </a>
        </div>`;
        document.getElementById(`search-content`).appendChild(searchElement);
    }
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

async function showKeyword(){
    const response = await fetch(`/getKeyword/${searchTerm}`,{method:'GET'});
    var data = await response.json();
    if(data){
        console.log(data);
        for (const movie of data){
            appendMovie(movie);
        }
    }
}

async function showDirector(){
    const response = await fetch(`/getDirector/${searchTerm}`,{method:'GET'});
    var data = await response.json();
    if(data){
        console.log(data);
        for (const movie of data){
            appendMovie(movie);
        }
    }
}

window.addEventListener('load', function() {
    let type = url_split[url_split.length-2];
    if (type == "search"){
        showSearch()
    }
    if (type == "keyword"){
        showKeyword();
    }
    if (type == "director"){
        showDirector();
    }
});