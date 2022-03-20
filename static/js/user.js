var user_valid = false;
let user_data = null;
let rated_movies = []

async function checkUser(){
    const response = await fetch(`/getUser/`,{method:'GET'});
    const data = await response.json();
    console.log(data);
    //console.log(data.user_ratings);
    if(data.user_id!="null")
    {
        user_valid = true;
    }
    return data;
}

async function showUserInfo(){
    user_data = await checkUser();
    document.getElementById("username").innerHTML=`<i class="fa fa-user"></i>  ${user_data.username}`
    document.getElementById("date-joined").innerHTML=`Member since ${formatDate(user_data.date_joined)}`

    if(user_data.user_ratings.length > 0){
        htmlScrollers("user-ratings", "Your Ratings", "ratings-scroller")
        // for (const movie of user_data.user_ratings){
        //     const response = await fetch(`/get_movie_tmdb/${movie.tmdb_id}`,{method:'GET'});
        //     const movie_det = await response.json();
        //     movie_det[0]["user_rating"] = movie.rating;
        //     rated_movies.push(movie_det[0]);
        // }
        if(user_data.user_ratings.length > 10){
            for (i=0;i<10;i++){
                const response = await fetch(`/get_movie_tmdb/${user_data.user_ratings[i].tmdb_id}`,{method:'GET'});
                const movie_det = await response.json();
                movie_det[0]["user_rating"] = user_data.user_ratings[i].rating;
                showScroller(movie_det[0], "ratings-scroller");
            }
            const show_moreEl = document.createElement('div');
            show_moreEl.classList.add('scroller-item-more');
            show_moreEl.setAttribute("onclick",``);      
            show_moreEl.innerHTML = `
            <p class="movie-flex">
                <a class="title" href="" title="See all ${user_data.user_ratings.length} ratings">
                    <bdi>See all ${user_data.user_ratings.length} ratings</bdi>
                </a>
            </p>`;
            document.getElementById("user-ratings").appendChild(show_moreEl);
        }
        else{
            for(const movie of user_data.user_ratings){
                const response = await fetch(`/get_movie_tmdb/${movie.tmdb_id}`,{method:'GET'});
                const movie_det = await response.json();
                movie_det[0]["user_rating"] = movie.rating;
                showScroller( movie_det[0], "ratings-scroller");
            }
        }
    }
}

function styleTitle(title){
    if(title.length > 19)
    {
        title = title.substring(0, 19);
        title = title + "...";
    }
    return title;
}

function formatDate(date){
    //console.log(date);
    year = date.substring(0, 4)
    //console.log(year);
    month = date.substring(5,7)
    //console.log(month)
    return `${month}.${year}`
}

function htmlScrollers(div_to_append, h3_text, div2_id){
    let h3 = document.createElement('h3'); 
    h3.textContent = h3_text;
    let div1 = document.createElement('div');
    div1.className = "user-scroller";
    let div2 = document.createElement('div');
    div2.className = "scroller";
    div2.id = div2_id;
    div1.appendChild(div2);
    document.getElementById(`${div_to_append}`).appendChild(h3);
    document.getElementById(`${div_to_append}`).appendChild(div1);
}


function showScroller(data, appendto){
    const movieEl = document.createElement('div');
    movieEl.classList.add('scroller-item');
    movieEl.setAttribute("onclick",`getMovieDetails(${data.id})`);      
    movieEl.innerHTML = `
    <div class="image_content">
        <a href="/details/${data.id}" title="${data.title}">
            <img loading="lazy" class="poster" src="/${data.poster}">
        </a>
    </div>
    <p class="movie-flex">
        <a class="title" href="/details/${data.id}" title="${data.title}">
            <bdi>${styleTitle(data.title)}</bdi>
        </a>
        <span class="rating"><a><i class="fa fa-star"></i> </a>${data.user_rating}</span>
    </p>`;
    document.getElementById(`${appendto}`).appendChild(movieEl);
}

window.onload = function() {
    showUserInfo();
}
