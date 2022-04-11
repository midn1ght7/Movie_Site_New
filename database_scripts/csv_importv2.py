import pandas as pd
import sqlite3
from datetime import datetime

movies = pd.read_csv("movielens_25m/movies.csv")
ratings = pd.read_csv("movielens_25m/ratings.csv")
links = pd.read_csv("movielens_25m/links.csv")

def to_date(timestamp):
    return str(datetime.fromtimestamp(timestamp))

def add_rows(start):
    con = sqlite3.connect('db.sqlite3')
    cur = con.cursor()
    cur.execute('DELETE FROM rating_rating')
    cur.execute("UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='rating_rating'")
    cur.execute('SELECT COUNT(*) FROM movie_movie')
    cur_result = cur.fetchone()
    not_found = 0
    found = 0
    progress = start
    total = cur_result[0]
    sql = 'SELECT * FROM movie_movie WHERE id BETWEEN '+ str(start) +' AND '+ str(total)
    for row in cur.execute(sql):
        db_title = row[-6]
        db_tmdbid = row[-20]
        links_row = links[links['tmdbId'] == db_tmdbid]
        if links_row.empty:
            not_found += 1
            print(db_title,"does not exist in csv.")
        else:
            found += 1
            movieId = links_row['movieId'].values[0]
            movies_row = movies[movies['movieId'] == movieId]
            print("ID:",progress, "DB:", db_tmdbid, db_title, "==", "CSV:", movies_row['movieId'].values[0], movies_row['title'].values[0])
            csv_ratings = ratings[ratings['movieId'] == movies_row['movieId'].values[0]]
            
            csv_ratings.drop('movieId',axis='columns', inplace=True)
            csv_ratings['rating'] = csv_ratings['rating'].apply(lambda x: x * 2)
            csv_ratings['timestamp'] = csv_ratings['timestamp'].apply(lambda x: to_date(x))
            csv_ratings['tmdb_id'] = db_tmdbid
            csv_ratings = csv_ratings.reindex(columns=['userId', 'rating', 'tmdb_id', 'timestamp'])

            ratings_tuples = [tuple(entry) for entry in csv_ratings.values]
            #print(ratings_tuples)
            sql = """INSERT INTO rating_rating (user_id, rating, tmdb_id, timestamp) VALUES (?, ?, ?, ?) """
            data = ratings_tuples
            cur = con.cursor()
            cur.executemany(sql, data)
        progress += 1 
    print("Found: ",found,"out of:",total)
    con.commit()
    con.close()
    
add_rows(0)

