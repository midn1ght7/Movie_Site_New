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


def get_popular(request):
    movies = list(Movie.objects.all().order_by('-popularity'))[:20]
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def get_movie(request, pk):
    movies = Movie.objects.get(pk=pk)
    return JsonResponse([movies.serialize()], safe=False)

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
    return result

def get_similar(request, pk):
    similar_to = Movie.objects.get(pk=pk)
    neighbors = predict_score(similar_to)
    id_list = []
    score_list = []
    print('\nRecommended Movies: \n')
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
    
    print("Filtered movies:", len(filtered_tmdb_ids))
    
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
    print("Starting collabRecommendation...")
    selected_movie = Movie.objects.get(tmdb_id=tmdb_id)
    min_movie_ratings = 10
    min_user_ratings = 80
    print("no_users_voted...")
    #make a list of only tmdb ids of movies who were rated at least x=(min_movie_ratings) times
    no_users_voted = (Rating.objects.values('tmdb_id').annotate(ratings=Count('tmdb_id')).filter(ratings__gte=min_movie_ratings).values_list('tmdb_id').order_by())
    print("no_movies_voted...")
    #make a list of only user ids of users who voted at least x=(min_user_ratings) times
    no_movies_voted = (Rating.objects.values('user_id').annotate(ratings=Count('user_id')).filter(ratings__gte=min_user_ratings).values_list('user_id').order_by())
    #make a list of genres to make the final_dataset more accurate and smaller
    try:
        rating_obj = Rating.objects.filter(tmdb_id=tmdb_id)
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
        #filtering the dataset using our lists
        final_dataset = pivot(Rating.objects.filter(filter1 & filter2 & filter3), 'tmdb_id_id', 'user_id', 'rating', default=0)
        print("made the final_dataset!")
        values_array = []

        movies_ids = []
        user_ids = []
        for label in final_dataset.values(): 
            if(label['tmdb_id_id'] not in movies_ids):
                movies_ids.append(label['tmdb_id_id'])
            if(label['user_id'] not in user_ids):
                user_ids.append(label['user_id'])

        if tmdb_id in movies_ids:
            print("Converting query_set to array...")
            #convert the query_set to array of rating arrays
            for movie in final_dataset:
                array = []
                for user in user_ids:
                    data = movie[str(user)]
                    array.append(data)
                values_array.append(array)

            csr_data = csr_matrix(values_array)

            knn = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=20, n_jobs=-1)
            knn.fit(csr_data)

            n_movies_to_recommend = 10

            id_list = []
                
            print("Calculating nearest neighbors...")
            distances , indices = knn.kneighbors(csr_data[movies_ids.index(tmdb_id)],n_neighbors=n_movies_to_recommend+1)    
            rec_movie_indices = sorted(list(zip(indices.squeeze().tolist(),distances.squeeze().tolist())),key=lambda x: x[1])[:0:-1]
            recommend_frame = []
                    
            for val in rec_movie_indices:
                print(val)
                idx = movies_ids[val[0]]
                print(idx)
                found_movie = Movie.objects.get(tmdb_id=idx)
                id_list.append(found_movie.tmdb_id)
                recommend_frame.append({'Title':found_movie.title,'Distance':val[1],'index:':val[0],'tmdb_id:':idx})
            print(recommend_frame)

            movies = list(Movie.objects.filter(tmdb_id__in=id_list))
            return JsonResponse([movie.serialize() for movie in movies], safe=False)

        else:
            print("Can't recommend. This movie doesn't have enough ratings.")
            return JsonResponse({"null"})
    except Rating.DoesNotExist:
        print("Not one rating for this movie exists in the database")
        return JsonResponse({"data": "null"})