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
    document.getElementById("username").innerHTML=`<a class='profile-href' href='/user/${user_data.user_id}'><i class="fa fa-user"></i> ${user_data.username}</a> ${gettext('user-list')}: ${list_data.name}`
}

function styleTitle(title, release_date){
    release_date = release_date.substring(0,4);
    release_date = '('+release_date+')';
    return title + " " + release_date
}

async function appendMovie(data){
    const Element = document.createElement('div');
    Element.id = `list-item-${data.tmdb_id}`
    Element.classList.add('list-item');
    if(user_id == document.getElementById('user_id').innerHTML){
        Element.innerHTML = `
        <div class="item-poster">
            <a href="/details/${data.id}" title="${data.title}">
                <img loading="lazy" class="poster" src="/${data.poster}">
            </a>
        </div>
        <div class="item-data">
            <a class="item-title" href="/details/${data.id}" title="${data.title}">
                ${styleTitle(data.title, data.release_date)}
            </a>
            <a class="item-remove" id="${data.tmdb_id}" title=${gettext('remove-from-list')}>
            ${gettext('remove-from-list')}
            </a>
            <a class="item-overview">
                ${data.overview}
            </a>
        </div>`;
    }
    else{
        Element.innerHTML = `
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
    }     
    document.getElementById(`watchlist-content`).appendChild(Element);
    if(user_id == document.getElementById('user_id').innerHTML){
        document.getElementById(`${data.tmdb_id}`).onclick = async function(){
            //alert(this.id)
            let this_movie_tmdb_id = this.id;
            const response = await fetch(`../../../addToList/${user_id}/${this_movie_tmdb_id}/${list_id}`,{method:'POST'});
            const data = await response.json();
            console.log("addToList:",data);
            document.getElementById(`list-item-${this_movie_tmdb_id}`).remove();
        }
    }
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
