from email.mime import base
from msilib.schema import Binary, ListView
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

def getUserInfo(request):
    if request.user.is_authenticated:
        current_user = request.user
        if hasattr(current_user, 'account'):
            print (current_user.account.ratings)
            return JsonResponse({'user_id': current_user.id, 'user_ratings': current_user.account.ratings})
        else:
            return JsonResponse({'user_id': current_user.id, 'user_ratings': "null"})
    else:
        return JsonResponse({'user_id': "null", 'user_ratings': "null"})

# def createMovieList(response):
#     if response.method == "POST":
#         form = CreateNewList(response.POST)

#         if form.is_valid():
#             n = form.cleaned_data["name"]
#             response.user.movielist_set.create(name=n)
        
#         return HttpResponseRedirect("/%i" %t.id)

#     else:
#         form = CreateNewList()
        
#     return render(response, "movie/movie_list.html", {"form":form})