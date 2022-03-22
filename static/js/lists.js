let url = window.location.href
var url_split = url.split('/')
let user_id = url_split[url_split.length-2];
let user_data = null;

async function userData(){
    const response = await fetch(`/getUser/${user_id}`,{method:'GET'});
    const data = await response.json();
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${data.username}'s lists:`
}

function styleTitle(title){
    if(title.length > 19)
    {
        title = title.substring(0, 16);
        title = title + "...";
    }
    return title;
}

function htmlScrollers(div_to_append, h3_text, div2_id, div0_id){
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
    div0.appendChild(div1);
    document.getElementById(`${div_to_append}`).appendChild(div0);
}

async function userLists(){
    const response = await fetch(`/getUserLists/${user_id}`,{method:'GET'});
    const user_lists = await response.json();
    console.log(user_lists);
    if(user_lists.user_lists.length > 0){
        for (const list of user_lists.user_lists)
        {
            htmlScrollers("lists-content", `${list.name}`, `${list.name}-scroller`, `user-scroller-top-${list.id}`)
            if(list.movies.length > 0){
                if (list.movies.length > 10) {
                    for (i = 0; i < 10; i++) {
                        appendToScroller(list.movies[i], `${list.name}-scroller`);
                    }
                }
                else {
                    for (const movie of list.movies) {
                        appendToScroller(movie, `${list.name}-scroller`);
                    }
                }
                const show_moreEl = document.createElement('div');
                show_moreEl.classList.add('scroller-item-more');
                show_moreEl.setAttribute("onclick", `location.href='/user/${user_id}/list/${list.id}';`);
                show_moreEl.innerHTML = `
                    <p class="movie-flex">
                        <a class="title" title="See whole list (${list.movies.length})">
                            See whole list (${list.movies.length})
                        </a>
                    </p>`;
                document.getElementById(`user-scroller-top-${list.id}`).appendChild(show_moreEl);
            }
            else{
                //alert(list.name+"empty!")
                let h3 = document.createElement('h3'); 
                h3.textContent = "This list is empty.";
                document.getElementById(`${list.name}-scroller`).appendChild(h3);
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


window.addEventListener('load', async function() {
    await userData();
    userLists();
});
