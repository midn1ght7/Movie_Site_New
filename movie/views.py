from msilib.schema import Binary, ListView
import weakref
from django.shortcuts import render

# Create your views here.
from django.views.generic import ListView, DetailView
from numpy import moveaxis
from .models import Movie, Binary
from django.shortcuts import render
from django.http import JsonResponse
from django.core import serializers

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

    binary_set = Binary.objects.all()

    def getNeighbors(K):
        distances = []
    
        for movie in binary_set:
            if movie.tmdb_id != baseMovie.tmdb_id:
                if "1" in movie.genres and   "1" in movie.keywords:
                    dist = Similarity(baseMovie.tmdb_id, movie.tmdb_id)
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

def Similarity(movieId1, movieId2):
    binary_genres = Binary._meta.get_field('genres')

    a = Binary.objects.get(tmdb_id = movieId1)
    b = Binary.objects.get(tmdb_id = movieId2)
    
    genresA = binary_genres.value_from_object(a)
    genresA = bin_str_tolist(genresA)
    genresB = binary_genres.value_from_object(b)
    genresB = bin_str_tolist(genresB)

    #print(genresA)
    #print(genresB)

    genreDistance = spatial.distance.cosine(genresA, genresB)

    binary_keywords = Binary._meta.get_field('keywords')

    keywordsA = binary_keywords.value_from_object(a)
    keywordsA = bin_str_tolist(keywordsA)
    keywordsB = binary_keywords.value_from_object(b)
    keywordsB = bin_str_tolist(keywordsB)

    #print(keywordsA)
    #print(keywordsB)

    wordsDistance = spatial.distance.cosine(keywordsA, keywordsB)

    return genreDistance + wordsDistance

def bin_str_tolist(binary_string):
    binary_string = binary_string.replace(",","")
    binary_list = []
    for char in binary_string:
        binary_list.append(int(char))
    return binary_list