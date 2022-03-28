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
      <img src="/${poster}" alt="${title}">
      <div class="movie-info">
          <h3>"${title}"</h3>
          <span class="${getColor(vote_average)}">${vote_average}</span>
      </div>
      <div class="overview">
          <h3>${gettext("overview")}</h3>
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
        showMovies(movies, gettext("most-popular-title"));
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
        showMovies(movies, gettext("top-rated-title"));
    })
}
getTop()

function getMovieDetails(id)
{
    window.location = `/details/${id}`;
}

window.addEventListener('load', function() {

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
});



