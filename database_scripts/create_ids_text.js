import sqlite3 from "sqlite3";

// Require for type: module package.json
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//DATABASE CONNECTION
let db = new sqlite3.Database('db.sqlite3');

var id_array = []

async function getfromDB(){
    return new Promise(function (resolve, reject) {
        db.serialize(function() {
            db.each("SELECT * FROM movie_movie", (error, row) => {
                if (error) { return reject(error); }
                else {
                    if(row) {
                        id_array.push(row.tmdb_id);
                    }    
                }
            });
            db.get("", function(err, row)  {
                resolve(true)
            });
        });
    });
}

async function doStuff(){
    await getfromDB();
    var fs = require('fs');
    fs.writeFile('database_ids.txt', id_array.toString(), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
}

doStuff();
