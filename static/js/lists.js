let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    console.log(data);
    document.getElementById("username").innerHTML=`${gettext('user-lists')} <a class='profile-href' href='/user/${data.user_id}'> <i class="fa fa-user"></i> ${data.username}</a>:`
    document.getElementById("username").onclick = `location.href = '/user/${data.id}';`
    if(user_id == document.getElementById('user_id').innerHTML){
        let div = document.createElement('div');
        div.innerHTML = `
        <div class="scroller-item-more" onclick="location.href='/list/create'">
            <p class="movie-flex">
                <a class="title" title="${gettext('create-list')}">
                ${gettext('create-list')}   
                </a>    
            </p>
        </div>`
        document.getElementById('lists-user').appendChild(div);
    }
}

function styleTitle(title){
    if(title.length > 19)
    {
        title = title.substring(0, 16);
        title = title + "...";
    }
    return title;
}

async function htmlScrollers(div_to_append, h3_text, div2_id, div0_id, list_id){
    let div0 = document.createElement('div');
    div0.className = "user-scroller-top"
    div0.id = div0_id
    let h3 = document.createElement('h3'); 
    h3.textContent = h3_text;

    let div1 = document.createElement('div');
    div1.className = "user-scroller";
    let div2 = document.createElement('div');
    div2.className = "scroller";
    div2.id = div2_id;
    div1.appendChild(div2);
    div0.appendChild(h3);
    if(user_id == document.getElementById('user_id').innerHTML){
        const handler_div = await htmlHandlers(list_id);
        div0.appendChild(handler_div);
    }
    div0.appendChild(div1);
    document.getElementById(`${div_to_append}`).appendChild(div0);
}

async function htmlHandlers(list_id){
    let div = document.createElement('div');
    div.className = 'list-handlers'
    let a_edit = document.createElement('a');
    a_edit.setAttribute("onclick", `location.href='/list/edit/${list_id}';`);
    a_edit.innerHTML = gettext('edit-list-specific')
    let a_delete = document.createElement('a');
    a_delete.id = `${list_id}`
    a_delete.onclick = async function(){
        const response = await fetch(`../../list/delete/${this.id}`,{method:'POST'});
        const data = await response.json();
        console.log(data);
        document.getElementById(`user-scroller-top-${this.id}`).remove();
    }
    a_delete.innerHTML = gettext('delete-list-specific')
    div.appendChild(a_edit);
    div.innerHTML += ' | ';
    div.appendChild(a_delete);
    //document.getElementById(`user-scroller-top-${list_id}`).appendChild(div);
    return div;
}

async function userLists(){
    const response = await fetch(`/getUserLists/${user_id}`,{method:'GET'});
    const user_lists = await response.json();
    console.log(user_lists);
    if(user_lists.user_lists.length > 0){
        for (const list of user_lists.user_lists)
        {
            await htmlScrollers("lists-content", `${list.name}`, `${list.id}-scroller`, `user-scroller-top-${list.id}`, `${list.id}`)
            if(list.movies.length > 0){
                if (list.movies.length > 10) {
                    for (i = 0; i < 10; i++) {
                        appendToScroller(list.movies[i], `${list.id}-scroller`);
                    }
                }
                else {
                    for (const movie of list.movies) {
                        appendToScroller(movie, `${list.id}-scroller`);
                    }
                }
                const show_moreEl = document.createElement('div');
                show_moreEl.classList.add('scroller-item-more');
                show_moreEl.setAttribute("onclick", `location.href='/user/${user_id}/list/${list.id}';`);
                show_moreEl.innerHTML = `
                    <p class="movie-flex">
                        <a class="title" title="${gettext('see-list')} (${list.movies.length})">
                        ${gettext('see-list')} (${list.movies.length})
                        </a>
                    </p>`;
                document.getElementById(`user-scroller-top-${list.id}`).appendChild(show_moreEl);
                listRecommendations(list);
            }
            else{
                //alert(list.name+"empty!")
                let h3 = document.createElement('h3'); 
                h3.textContent = gettext('list-empty');
                document.getElementById(`${list.id}-scroller`).appendChild(h3);
            }
        }
    }
}

function appendToScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`location.href='/details/${data.id}';`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" title="${data.title}">
            ${styleTitle(data.title)}
        </a>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}

async function listRecommendations(list){
    const response = await fetch(`/getListRecommendations/${list.id}`,{method:'GET'});
    const responseJSON = await response.json();
    console.log("Recommendations for:",list.id,":",responseJSON);

    let h3 = document.createElement('h3');
    h3.textContent = `${gettext('list-recommendations')} ${list.name}`
    let div0 = document.createElement('div');
    let div1 = document.createElement('div');
    div0.className = "user-scroller";
    div1.className = "scroller"
    div1.id = `${list.id}-recommendation-scroller`
    div0.appendChild(div1);
    document.getElementById(`user-scroller-top-${list.id}`).appendChild(h3);
    document.getElementById(`user-scroller-top-${list.id}`).appendChild(div0);
    for (const movie of responseJSON){
        showRecommendationScroller(movie, `${list.id}-recommendation-scroller`)
    }
}

function showRecommendationScroller(data, appendto){
    percent = data.similarity_score
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`location.href='/details/${data.id}';`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" title="${data.title}">
            ${styleTitle(data.title)}
        </a>
        <span class="rating"><a><i class="fa fa-percent"></i> </a>${Math.round((1-data.similarity_score)*100)}</span>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}


window.addEventListener('load', async function() {
    await userData();
    userLists();
});
