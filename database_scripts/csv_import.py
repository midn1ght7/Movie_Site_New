import pandas as pd
#import numpy as np
#from scipy.sparse import csr_matrix
#from sklearn.neighbors import NearestNeighbors
#import matplotlib.pyplot as plt
#import seaborn as sns
movies = pd.read_csv("movielens/movie.csv")
ratings = pd.read_csv("movielens/rating.csv")


import sqlite3

con = sqlite3.connect('db.sqlite3')

cur = con.cursor()

found = 0
total = 0
for row in cur.execute('SELECT * FROM movie_movie'):
    db_title = row[-4]
    db_tmdbid = row[-1]
    db_title_year = str(row[-4]) + " (" + str(row[-9])[0:4]+")"
    #print(db_title_year)
    total += 1 
    csv_row = movies[movies['title'].str.contains(db_title_year, case=False, regex=False)]
    if csv_row.empty:
        print(db_title_year,"does not exist in csv.")
    else:
        print("Found: ",csv_row["title"])
        #print(csv_row['movieId'].index[0])
        found += 1 
        csv_ratings = ratings[ratings['movieId'] == csv_row['movieId'].index[0]]
        #print(csv_ratings)
        for rating in csv_ratings.index:
            rating_userid = csv_ratings.loc[[rating], 'userId'].item()
            rating_rating = (csv_ratings.loc[[rating], 'rating'].item())*2
            #print(rating_userid, rating_rating)
            data = (rating_userid, rating_rating, db_tmdbid)
            sql = '''INSERT INTO rating_rating (user_id, rating, tmdb_id) VALUES (?, ?, ?)'''
            cur = con.cursor()
            cur.execute(sql, data)
            print("inserted:",data,"into db",db_title_year)
        
print("Found: ",found,"out of:",total)
con.commit()
con.close()