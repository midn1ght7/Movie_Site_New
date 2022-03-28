let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    user_data = data;
    document.getElementById("username").innerHTML=`${gettext('user-watchlist')} <a class='profile-href' href='/user/${data.user_id}'><i class="fa fa-user"></i> ${data.username}</a>:`
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
            <a class="item-remove" id="${data.tmdb_id}" title="${gettext('watchlist-remove')}">
            ${gettext('watchlist-remove')}
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
            const response = await fetch(`../../addToWatchlist/${user_id}/${this_movie_tmdb_id}`,{method:'POST'});
            const data = await response.json();
            console.log("addToWatchlist:",data);
            document.getElementById(`list-item-${this_movie_tmdb_id}`).remove();
        }
    }
}

async function showWatchlist(){
    const response = await fetch(`/getUserWatchlist/${user_id}`,{method:'GET'});
    const data = await response.json();
    console.log(data);
    if(data.user_watchlist.length > 0){
        for (const movie of data.user_watchlist)
        {
            appendMovie(movie);
        }
    }
    else{
        let h3 = document.createElement('h3'); 
        h3.textContent = `${gettext('watchlist-empty-1')} ${user_data.username} ${gettext('watchlist-empty-2')}`;
        document.getElementById(`watchlist-content`).appendChild(h3);
    }
}


window.addEventListener('load', async function() {
    await userData();
    showWatchlist();
});
