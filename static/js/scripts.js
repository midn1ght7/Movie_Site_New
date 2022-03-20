
var last_fetch = null;
var start = 0;
var finish = 20;

function getColor(vote){
    if(vote>=7)
    {
        return 'green';
    }
    else if(vote>= 3){
        return 'orange';
    }
    else{
        return 'red';
    }
}

async function showMovies(movies, title){
    document.getElementById("list-movies").innerHTML = '';
    document.getElementById("current-list").innerHTML = title;
    console.log(movies);
    movies.forEach( movie => {
      const {id, title, poster, vote_average, overview} = movie;
      const movieEl = document.createElement('div');
      movieEl.classList.add('movie');
      movieEl.setAttribute("onclick",`getMovieDetails(${id})`);      
      movieEl.innerHTML = `
      <img src="${poster}" alt="${title}">
      <div class="movie-info">
          <h3>"${title}"</h3>
          <span class="${getColor(vote_average)}">${vote_average}</span>
      </div>
      <div class="overview">
          <h3>Overview</h3>
          ${overview}
      </div>`;
      document.getElementById("list-movies").appendChild(movieEl);
    })
}

async function getPopular(){
    fetch(`/get_popular/${start}/${finish}`).then((response) => {
        if (response.ok) {
            if(last_fetch != "popular"){
                last_fetch = "popular";
                start = 0;
                finish = 20;
            }
            return response.json();
        }
        else{
            throw new Error("Error fetching: "+item);
        }
    }).then(movies =>
    {
        showMovies(movies, "Most Popular Movies");
    })
}

async function getTop(){
    fetch(`/get_top/${start}/${finish}`).then((response) => {
        if (response.ok) {
            if(last_fetch != "top"){
                last_fetch = "top";
                start = 0;
                finish = 20;
            }
            return response.json();
        }
        else{
            throw new Error("Error fetching: "+item);
        }
    }).then(movies =>
    {
        showMovies(movies, "Top Rated Movies");
    })
}
getTop()

function getMovieDetails(id)
{
    fetch(`/details/${id}`, 
    {
        method: 'GET',
    });
    window.location = `/details/${id}`;
}



window.onload=function(){

    //SEARCH BUTTON
    var search_form = document.getElementById("form-search");
    search_form.addEventListener('submit', e =>{
        e.preventDefault();
        const searchTerm = document.getElementById("search-input").value;
        if(searchTerm){
            fetch(`/search/${searchTerm}`).then((response) => {
                if (response.ok) {
                    last_fetch = searchTerm;
                    document.getElementById("btn-load-more").style.visibility = 'hidden'
                    return response.json();
                }
                else{
                    throw new Error("Error fetching: "+item);
                }
            }).then(movies =>
            {
                showMovies(movies, "Search: "+searchTerm);
            })
        }
    })

    //POPULAR BUTTON
    var popular_btn = document.getElementById("btn_popular");
    popular_btn.onclick = function (){
        getPopular();
        load_btn.style.visibility = 'visible';
    }

    //TOP BUTTON
    var top_btn = document.getElementById("btn_top");
    top_btn.onclick = function () {
        getTop();
        load_btn.style.visibility = 'visible';
    }

    //LOAD MORE BUTTON 
    var load_btn = document.getElementById("btn-load-more");
    load_btn.onclick = function (){
        if(last_fetch != null){
            if(last_fetch == "popular"){
                finish = finish + 20;
                getPopular();
            }
            if(last_fetch == "top"){
                finish = finish + 20;
                getTop();
            }
        }
    }
}   



