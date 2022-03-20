from email.mime import base
from msilib.schema import Binary, ListView
from typing import final
import weakref
from django.shortcuts import render

# Create your views here.
from django.views.generic import ListView, DetailView
from numpy import moveaxis
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

def get_similar(request, pk):
    similar_to = Movie.objects.get(pk=pk)
    similar_list = predict_score(similar_to)

    movies = list(Movie.objects.filter(tmdb_id__in=similar_list))
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def predict_score(baseMovie):
    print('Selected Movie: ',baseMovie.title)
    baseMovieBin = Binary.objects.get(tmdb_id = baseMovie.tmdb_id)

    bm_genres = baseMovie.get_genres()
    query = Q()
    for genre in bm_genres:
        query = query | Q(genres__icontains=genre)

    filtered_tmdb_ids = []

    for movie in Movie.objects.filter(query):
        filtered_tmdb_ids.append(movie.tmdb_id)
    
    print("Filtered movies:", len(filtered_tmdb_ids))
    
    binary_set = Binary.objects.filter(tmdb_id__in=filtered_tmdb_ids)

    #binary_set = Binary.objects.all()

    def getNeighbors(K):
        distances = []
    
        for movie in binary_set:
            if movie.tmdb_id != baseMovie.tmdb_id:
                if "1" in movie.genres and "1" in movie.keywords:
                    dist = Similarity(baseMovieBin, movie)
                    distances.append((movie.tmdb_id, dist))
                else:
                    print("This movie has no genres or keywords: "+ str(movie.tmdb_id))

        distances.sort(key=operator.itemgetter(1))
        neighbors = []
    
        for x in range(K):
            neighbors.append(distances[x])
        return neighbors

    K = 10
    neighbors = getNeighbors(K)

    id_list = []
    
    print('\nRecommended Movies: \n')
    for index, neighbor in enumerate(neighbors):
        print(neighbor)
        id_list.append(neighbor[0])
    
    return id_list

def Similarity(baseMovie, compMovie):

    genreDistance = (spatial.distance.cosine(bin_str_tolist(baseMovie.genres), bin_str_tolist(compMovie.genres)))*0.25
    wordsDistance = spatial.distance.cosine(bin_str_tolist(baseMovie.keywords), bin_str_tolist(compMovie.keywords))

    return genreDistance + wordsDistance

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
    min_movie_ratings = 1
    min_user_ratings = 1
    #make a list of only tmdb ids of movies who were rated at least x=(min_movie_ratings) times
    no_users_voted = (Rating.objects.values('tmdb_id').annotate(ratings=Count('tmdb_id')).filter(ratings__gte=min_movie_ratings).values_list('tmdb_id').order_by())
    #make a list of only user ids of users who voted at least x=(min_user_ratings) times
    no_movies_voted = (Rating.objects.values('user_id').annotate(ratings=Count('user_id')).filter(ratings__gte=min_user_ratings).values_list('user_id').order_by())
    filter1 = Q(tmdb_id__in = no_users_voted)
    filter2 = Q(user_id__in = no_movies_voted)
    #filtering the dataset using our lists
    final_dataset = pivot(Rating.objects.filter(filter1 & filter2), 'tmdb_id_id', 'user_id', 'rating', default=0)

    values_array = []

    movies_ids = []
    user_ids = []
    for label in final_dataset.values(): 
        if(label['tmdb_id_id'] not in movies_ids):
            movies_ids.append(label['tmdb_id_id'])
        if(label['user_id'] not in user_ids):
            user_ids.append(label['user_id'])

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

    n_movies_to_recommend = 5

    movie_list = Movie.objects.get(tmdb_id=tmdb_id)
    if movie_list:        
        distances , indices = knn.kneighbors(csr_data[movies_ids.index(tmdb_id)],n_neighbors=n_movies_to_recommend+1)    
        rec_movie_indices = sorted(list(zip(indices.squeeze().tolist(),distances.squeeze().tolist())),key=lambda x: x[1])[:0:-1]
        recommend_frame = []
        id_list = []
        for val in rec_movie_indices:
            print(val)
            idx = movies_ids[val[0]]
            print(idx)
            found_movie = Movie.objects.get(tmdb_id=idx)
            id_list.append(found_movie.tmdb_id)
            recommend_frame.append({'Title':found_movie.title,'Distance':val[1]})
        print(recommend_frame)

        movies = list(Movie.objects.filter(tmdb_id__in=id_list))
        return JsonResponse([movie.serialize() for movie in movies], safe=False)
    else:
        return "No movies found. Please check your input"