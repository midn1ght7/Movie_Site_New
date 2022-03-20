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

async function queryMovies(){
    fetch('/get_popular').then((response) => {
        if (response.ok) {
            return response.json();
        }
        else{
            throw new Error("Error fetching: "+item);
        }
    }).then(movies =>
    {
        showMovies(movies, "Top 20 Most Popular Movies");
    })
}

queryMovies();

function getMovieDetails(id)
{
    fetch(`/details/${id}`, 
    {
        method: 'GET',
    });
    window.location = `/details/${id}`;
}


//SEARCH BUTTON
window.onload=function(){
    var search_form = document.getElementById("form-search");
    search_form.addEventListener('submit', e =>{
        e.preventDefault();
        const searchTerm = document.getElementById("search-input").value;
        if(searchTerm){
            fetch(`/search/${searchTerm}`).then((response) => {
                if (response.ok) {
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

}



