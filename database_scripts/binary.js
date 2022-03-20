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

db.each("SELECT * FROM movie_binary", 
  (error, row) => {
  /*gets called for every row our query returns*/
    console.log(`${row.id}`);
    db.run(`DELETE FROM movie_binary WHERE id=?`, row.id, function(err) {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Row${row.id} deleted`);
  });
});

db.run("UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='movie_binary'")

var genre_list = [];
var keyword_list = [];
var director_list = [];
var language_list = [];
var company_list = [];

async function makeGenres()
{
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        var obj = JSON.parse(`${row.genres}`);

                        for (var i in obj) {
                            //console.log(obj[i]["name"]);
                            if (!genre_list.includes(obj[i]["name"])) {
                                genre_list.push(obj[i]["name"]);
                            }
                        }
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

async function makeKeywords()
{
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        var obj = JSON.parse(`${row.keywords}`);
                        obj = obj["keywords"];

                        for (var i in obj) {
                            if (!keyword_list.includes(obj[i]["name"])) {
                                keyword_list.push(obj[i]["name"]);
                            }
                        }
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

async function makeDirectors()
{
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        if (!director_list.includes(row.director)) {
                            director_list.push(row.director);
                        }
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

async function makeLanguages()
{
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        if (!language_list.includes(row.original_language)) {
                            language_list.push(row.original_language);
                        }
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

async function makeCompanies()
{
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        if (!company_list.includes(row.production_company)) {
                            company_list.push(row.production_company);
                        }
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

function binaryGenres(row){
    try {
        var binary_genres = [];
        var genre_obj = JSON.parse(`${row.genres}`);
        for (var i in genre_list) {
            var found = false;
            for (var j in genre_obj) {
                if (genre_list[i] == genre_obj[j]["name"]) {
                    found = true;
                    binary_genres.push(1);
                }
            }
            if (found == false) {
                binary_genres.push(0);
            }
        }
        return binary_genres
    }
    catch (e) {
        console.log(e);
    }
}

function binaryKeywords(row){
    try {
        var binary_keywords = [];
        var keyword_obj = JSON.parse(`${row.keywords}`);
        keyword_obj = keyword_obj["keywords"];
        for (var i in keyword_list) {
            var found = false;
            for (var j in keyword_obj){
                if(keyword_list[i] == keyword_obj[j]["name"]){
                    found = true;
                    binary_keywords.push(1);
                }
            }
            if(found == false)
            {
                binary_keywords.push(0);
            }
        }
        return binary_keywords;
    }
    catch (e) {
        console.log(e);
    }
}

function binaryDirectors(row){
    try {
        var binary_directors = [];
        var director = `${row.director}`;
        for (var i in director_list) {
            if (director_list[i] == director) {
                binary_directors.push(1);
            }
            else {
                binary_directors.push(0);
            }
        }
        return binary_directors;
    }
    catch (e) {
        console.log(e);
    }
}

function binaryLanguages(row) {
    try {
        var binary_languages = [];
        var language = `${row.original_language}`;
        for (var i in language_list) {
            if (language_list[i] == language) {
                binary_languages.push(1);
            }
            else {
                binary_languages.push(0);
            }
        }
        return binary_languages;
    }
    catch (e) {
        console.log(e);
    }
}

function binaryCompanies(row) {
    try {
        var binary_companies = [];
        var company = `${row.production_company}`;
        for (var i in company_list) {
            if (company_list[i] == company) {
                binary_companies.push(1);
            }
            else {
                binary_companies.push(0);
            }
        }
        return binary_companies;
    }
    catch (e) {
        console.log(e);
    }
}

async function fillBinaryDB(){
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        var binary_genres = binaryGenres(row);
                        //console.log("Binary genres for movie id:"+`${row.tmdb_id}`+" "+binary_genres);
                        var binary_keywords = binaryKeywords(row);
                        //console.log(binary_keywords);
                        var binary_directors = binaryDirectors(row);
                        //console.log(binary_directors);
                        var binary_languages = binaryLanguages(row);
                        //console.log(binary_languages);
                        db.run(`INSERT INTO movie_binary 
                        (tmdb_id, genres, keywords, directors, languages) VALUES (?, ?, ?, ?, ?)`, 
                        `${row.tmdb_id}`, 
                        binary_genres, 
                        binary_keywords,
                        binary_directors,
                        binary_languages,
                        (err) => 
                        {
                            if (err) {
                            return console.log(err.message);
                            }
                        });
                        console.log("Successfully inserted movie of tmdb_id:"+`${row.tmdb_id}`);
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

await makeGenres();
console.log(genre_list);
await makeKeywords();
console.log(keyword_list);
await makeDirectors();
console.log(director_list);
await makeLanguages();
console.log(language_list);
//await makeCompanies();
//console.log(company_list);
await fillBinaryDB();


