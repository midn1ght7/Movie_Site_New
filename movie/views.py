from email.mime import base
from msilib.schema import Binary, ListView
from typing import final
import weakref
from django.shortcuts import render

# Create your views here.
from django.views.generic import ListView, DetailView
from numpy import moveaxis
from sklearn import neighbors
from .models import Movie, Binary
from django.shortcuts import render
from django.http import HttpResponseRedirect, JsonResponse
from django.core import serializers
from django.db.models import Q
from rating.models import Rating
from django.contrib.auth.models import User

from scipy import spatial
import operator


def movie_list(request):
    return render(request, 'movie/movie_list.html')

def movie_detail(request, pk):
    return render(request, 'movie/movie_detail.html')


def get_popular(request, start, finish):
    movies = list(Movie.objects.all().order_by('-popularity'))[start:finish]
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def get_top(request, start, finish):
    movies = list(Movie.objects.filter(vote_count__gte = 1000).order_by('-vote_average'))[start:finish]
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def get_movie(request, pk):
    movie = Movie.objects.get(pk=pk)
    return JsonResponse([movie.serialize()], safe=False)

def get_movie_tmdb(request, tmdb):
    movie = Movie.objects.get(tmdb_id=tmdb)
    return JsonResponse([movie.serialize()], safe=False)

def search(request, term):
    movies = list(Movie.objects.filter(title__icontains=term).order_by('-popularity'))
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def similar_response(movies,id_list,score_list):
    result = []
    for movie in movies:
        tmdb_id = movie.tmdb_id
        movie = movie.serialize()
        movie["similarity_score"] = (score_list[id_list.index(tmdb_id)])
        result.append(movie)
    result = sorted(result, key=lambda d: d["similarity_score"])
    return result

def get_similar(request, pk):
    similar_to = Movie.objects.get(pk=pk)
    neighbors = predict_score(similar_to)

    id_list = []
    score_list = []
    print('\nContent-based recommended movies: \n')
    for index, neighbor in enumerate(neighbors):
        print(neighbor)
        id_list.append(neighbor[0])
        score_list.append(neighbor[1])

    movies = list(Movie.objects.filter(tmdb_id__in=id_list))
    return JsonResponse(similar_response(movies, id_list, score_list), safe=False)

def predict_score(baseMovie):
    print('Selected Movie: ',baseMovie.title)
    baseMovieBin = Binary.objects.get(tmdb_id = baseMovie.tmdb_id)

    bm_genres = baseMovie.get_genres()
    bm_keywords = baseMovie.get_keywords()
    filtered_tmdb_ids = []

    genre_query = Q()
    for genre in bm_genres:
        genre_query = genre_query | Q(genres__icontains=genre)

    keyword_query = Q()
    for keyword in bm_keywords:
        keyword_query = keyword_query | Q(keywords__icontains=keyword)

    for movie in Movie.objects.filter(genre_query & keyword_query & Q(vote_count__gte=100)):
        filtered_tmdb_ids.append(movie.tmdb_id)
    
    print("Filtered movies for content-based recommendation:", len(filtered_tmdb_ids))
    
    binary_set = Binary.objects.filter(tmdb_id__in=filtered_tmdb_ids)

    def getNeighbors(K):
        distances = []
    
        for movie in binary_set:
            if movie.tmdb_id != baseMovie.tmdb_id:
                if "1" in movie.genres and "1" in movie.keywords and "1" in movie.directors and "1" in movie.languages:
                    dist = Similarity(baseMovieBin, movie)
                    distances.append((movie.tmdb_id, dist))

        distances.sort(key=operator.itemgetter(1))
        neighbors = []
    
        for x in range(K):
            neighbors.append(distances[x])
        return neighbors

    K = 10
    neighbors = getNeighbors(K)
    
    return neighbors

def Similarity(baseMovie, compMovie):

    genreDistance = (spatial.distance.cosine(bin_str_tolist(baseMovie.genres), bin_str_tolist(compMovie.genres)))*0.5
    wordsDistance = spatial.distance.cosine(bin_str_tolist(baseMovie.keywords), bin_str_tolist(compMovie.keywords))
    directorDistance = (spatial.distance.cosine(bin_str_tolist(baseMovie.directors), bin_str_tolist(compMovie.directors)))*0.3
    languageDistance = (spatial.distance.cosine(bin_str_tolist(baseMovie.languages), bin_str_tolist(compMovie.languages)))*0.2
    return genreDistance + wordsDistance + directorDistance + languageDistance

def bin_str_tolist(binary_string):
    binary_string = binary_string.replace(",","")
    binary_list = []
    for char in binary_string:
        binary_list.append(int(char))
    return binary_list

def getRating(request, tmdb_id):
    if request.user.is_authenticated:
        current_user = request.user
        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
            query = Rating.objects.get(user_id=current_user.id, tmdb_id = movie)
            print("Query exists")
            rating = query.rating
        except Rating.DoesNotExist:
            print("Query does not exist")
            rating = "null"
        return JsonResponse({'user_id': current_user.id, 'user_rating': rating})
    else:
        return JsonResponse({'user_id': "null", 'user_rating': "null"})

def addRating(request, tmdb_id, rating):
    print("Add Rating: ",tmdb_id, rating)
    if request.user.is_authenticated:
        current_user = request.user
        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
            query = Rating.objects.get(user_id=current_user.id, tmdb_id = movie)
            print("Query exists")
            print("Changed rating from "+str(query.rating)+" to "+str(rating))
            query.rating = rating
            query.save()
        except Rating.DoesNotExist:
            print("Query does not exist")
            Rating.objects.create(user_id=current_user.id, tmdb_id = movie, rating=rating)

        return JsonResponse({'user_id': current_user.id, 'user_rating': rating})
            
    else:
        return JsonResponse({'user_id': "null", 'user_rating': "null"})

from django_pivot.pivot import pivot
from django_pivot.histogram import histogram
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix
from django.db.models import Count

def collabRecommendation(request, tmdb_id):
    print("Starting Collaborative Recommendation of movie tmdb_id: "+str(tmdb_id))
    selected_movie = Movie.objects.get(tmdb_id=tmdb_id)
    min_movie_ratings = 10
    min_user_ratings = 10
    #make a list of only tmdb ids of movies who were rated at least x=(min_movie_ratings) times
    no_users_voted = (Rating.objects.values('tmdb_id').annotate(ratings=Count('tmdb_id')).filter(ratings__gte=min_movie_ratings).values_list('tmdb_id').order_by())
    print("Length of no_users_voted:",len(no_users_voted))
    #check if the movie was rated considering min_movie_ratings
    movie_in_ratings = False
    for i in no_users_voted:
        if (tmdb_id == i[0]):
            movie_in_ratings = True
            break
    
    if(movie_in_ratings == True):
        #make a list of only user ids of users who voted at least x=(min_user_ratings) times
        no_movies_voted = (Rating.objects.values('user_id').annotate(ratings=Count('user_id')).filter(ratings__gte=min_user_ratings).values_list('user_id').order_by())
        #make a list of only userr ids of users who liked the requested movie:
        rating_val=6
        users_who_liked = (Rating.objects.filter(tmdb_id=tmdb_id, rating__gte=rating_val).values_list('user_id').order_by())
        while(len(users_who_liked) > 1500):
            if(rating_val>=9):
                users_who_liked = (Rating.objects.values('user_id').annotate(ratings=Count('user_id')).filter(tmdb_id=tmdb_id, rating__gte=rating_val).values_list('user_id').order_by('-ratings'))[:1500]
                # for user in users_who_liked:
                #     print(user[0])
            else:
                rating_val += 1
                users_who_liked = (Rating.objects.filter(tmdb_id=tmdb_id, rating__gte=rating_val).values_list('user_id').order_by('user_id'))
            
            print("WHILE(Length of users_who_liked:",len(users_who_liked),")")
        print("Length of users_who_liked:",len(users_who_liked))
        #make a list of genres to make the final_dataset more accurate and smaller
        try:
            print("filtering by genres and keywords...")
            bm_genres = selected_movie.get_genres()
            bm_keywords = selected_movie.get_keywords()

            query1 = Q()
            for genre in bm_genres:
                query1 = query1 | Q(genres__icontains=genre)

            filtered_tmdb_ids = []
            
            for movie in Movie.objects.filter(query1):
                shared_keywords = 0
                for keyword in movie.get_keywords():
                    for bm_keyword in bm_keywords:
                        if keyword == bm_keyword:
                            shared_keywords += 1
                
                if(shared_keywords >= 1):
                    filtered_tmdb_ids.append(movie.tmdb_id)
                    #print(movie.title)
                    
            
            filter1 = Q(tmdb_id__in = no_users_voted)
            filter2 = Q(user_id__in = no_movies_voted)
            filter3 = Q(tmdb_id__in = filtered_tmdb_ids)
            filter4 = Q(user_id__in = users_who_liked)

            print("length of filtered_tmdb_list:", len(filtered_tmdb_ids))

            #filtering the dataset using our lists
            final_dataset = pivot(Rating.objects.filter(filter3 & filter4), 'tmdb_id_id', 'user_id', 'rating', default=0)
            print("made the final_dataset! of size:",len(final_dataset))

            values_array = []

            movies_ids = []
            user_ids = []
            for label in final_dataset.values(): 
                if(label['tmdb_id_id'] not in movies_ids):
                    movies_ids.append(label['tmdb_id_id'])
                if(label['user_id'] not in user_ids):
                    user_ids.append(label['user_id'])

            print("length of movies_ids:", len(movies_ids))
            print("length of user_ids:", len(user_ids))

            for index, movie in enumerate(movies_ids):
                print(index,":",movie)
            print("Converting query_set to array...")

            #convert the query_set to array of rating arrays
            for movie in final_dataset:
                array = []
                for user in user_ids:
                    data = movie[str(user)]
                    array.append(data)
                values_array.append(array)
            
            print("length of values_array:", len(values_array))

            #for index, value in enumerate(values_array):
                #print(index,":", value)
            
            n_movies_to_recommend = 10
            id_list = []
            score_list = []

            # csr_data = csr_matrix(values_array)

            # knn = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=20, n_jobs=-1)
            # knn.fit(csr_data)
                
            # print("Calculating nearest neighbors V1...")
            # distances , indices = knn.kneighbors(csr_data[movies_ids.index(tmdb_id)],n_neighbors=n_movies_to_recommend+1)    
            # rec_movie_indices = sorted(list(zip(indices.squeeze().tolist(),distances.squeeze().tolist())),key=lambda x: x[1])[:0:-1]
            # print(rec_movie_indices)
            # recommend_frame = []
                    
            # for val in rec_movie_indices:
            #     print(val)
            #     idx = movies_ids[val[0]]
            #     print(idx)
            #     found_movie = Movie.objects.get(tmdb_id=idx)
            #     id_list.append(found_movie.tmdb_id)
            #     recommend_frame.append({'Title':found_movie.title,'Distance':val[1],'index:':val[0],'tmdb_id:':idx})
            # #print(recommend_frame)

            print("Calculating nearest neighbors V2...")
            our_movie = values_array[movies_ids.index(tmdb_id)]
            #print(our_movie)
            distances = []
            our_movie_avg = sum(our_movie)/len(our_movie)
            print("Our Movie average vote:",our_movie_avg)
            for index, value in enumerate(values_array):
                if our_movie != value:
                    ratings = []
                    for rating in value:
                        if (rating != 0):
                            ratings.append(rating)
                    rating_avg = sum(ratings)/len(ratings)

                    if (len(ratings) >= 10 and rating_avg>7):
                        print("Rating average:",rating_avg)
                        dist = spatial.distance.cosine(our_movie, value) * ((10-rating_avg)*0.5)
                        distances.append((movies_ids[index], dist))

            distances.sort(key=operator.itemgetter(1))
            neighbors = []
            
            for x in range(n_movies_to_recommend):
                neighbors.append(distances[x])

            for neighbor in neighbors:
                print(neighbor)
                id_list.append(neighbor[0])
                score_list.append(neighbor[1])


            movies = list(Movie.objects.filter(tmdb_id__in=id_list))
            return JsonResponse(similar_response(movies, id_list, score_list), safe=False)

        except:
            print("There was an error")
            return JsonResponse([], safe=False)
    else:
        print("Not one rating for this movie exists in the database")
        return JsonResponse([], safe=False)