import fetch from "node-fetch";

//TMDB
const API_KEY = 'api_key=8cc7b14fbd7e6745695ae4dd54391660';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces';
const SEARCH_URL = BASE_URL+'/search/movie?'+API_KEY;
const LANG = '&language=en-US';

const POPULAR = BASE_URL+ '/discover/tv?'+API_KEY+'&sort_by=popularity.desc&';
const EXAMPLE = BASE_URL + '/movie/550?'+API_KEY+'&query=';

//DATABASE CONNECTION
import sqlite3 from "sqlite3";
let db = new sqlite3.Database('db.sqlite3');

db.each("SELECT * FROM movie_movie", 
  (error, row) => {
  /*gets called for every row our query returns*/
    console.log(`${row.id}`);
    db.run(`DELETE FROM movie_movie WHERE id=?`, row.id, function(err) {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Row${row.id} deleted`);
  });
});

db.run("UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='movie_movie'")

async function getKeywords(id){
    const response = await fetch(BASE_URL+'/movie/'+id+'/keywords?'+API_KEY+LANG);
    if(response.ok)
    {
        const data = await response.json();
        //console.log(data);
        return data;
    }
}

async function getDirector(id){
    const response = await fetch(BASE_URL+'/movie/'+id+'/credits'+'?'+API_KEY+LANG);
    var BreakException = {};
    if(response.ok)
    {
        try{
            const data = await response.json();
            //console.log(data);
            var found = false;
            for (const item of data.crew) {
                if(item.job == "Director"){
                    //console.log("Director of movie tmdb_id:",data.id,item.name);
                    found = true;
                    return item.name;
                }
            } 
            if (found == false){
                console.log("Director of movie tmdb_id:",data.id,"not found.");
                return "" 
            }
        }
        catch(e){
            if (e !== BreakException) throw e;
        }
    }
}

async function fillDB() {

    for (let i = 0; i < 10000; i++) {
        const response = await fetch(BASE_URL + '/movie/' + i + '?' + API_KEY + LANG);
        if (response.ok) {
            try {
                const data = await response.json();
                //console.log(data);
                if (data.vote_count >= 100) {
                    var keywords = await getKeywords(i);
                    var director = await getDirector(i);
                    let production_company;

                    if (data.backdrop_path == null) {
                        data.backdrop_path = "media/backdrops/missing.jpg"
                    }
                    else {
                        data.backdrop_path = "media/backdrops/" + `${data.id}` + "_b.jpg";
                    }

                    if (data.poster_path == null) {
                        data.poster_path = "media/posters/missing.jpg";
                    }
                    else {
                        data.poster_path = "media/posters/" + `${data.id}` + "_p.jpg";
                    }

                    if (data.overview == "") {
                        data.overview = "We don't have an overview for this movie.";
                    }

                    try {
                        if (data.production_companies != null) {
                            production_company = data.production_companies[0].name
                            //console.log(data.production_companies[0].name);
                        }
                    }
                    catch (e) {
                        production_company = ""
                        //console.log("Production company not found")
                    }

                    db.run(`INSERT INTO movie_movie 
                (tmdb_id, backdrop, budget, director, genres, keywords, original_language, original_title, overview, popularity, poster, production_company, release_date, revenue, runtime, status, tagline, title, vote_average, vote_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        `${data.id}`,
                        `${data.backdrop_path}`,
                        `${data.budget}`,
                        `${director}`,
                        JSON.stringify(data.genres),
                        JSON.stringify(keywords),
                        `${data.original_language}`,
                        `${data.original_title}`,
                        `${data.overview}`,
                        `${data.popularity}`,
                        `${data.poster_path}`,
                        `${production_company}`,
                        `${data.release_date}`,
                        `${data.revenue}`,
                        `${data.runtime}`,
                        `${data.status}`,
                        `${data.tagline}`,
                        `${data.title}`,
                        `${data.vote_average}`,
                        `${data.vote_count}`,
                        (err) => {
                            if (err) {
                                return console.log(err.message);
                            }
                        });
                    console.log("Successfully inserted movie of tmdb_id:" + `${data.id}`);
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }
}
fillDB();