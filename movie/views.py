from msilib.schema import ListView
import weakref
from django.shortcuts import render

# Create your views here.
from django.views.generic import ListView, DetailView
from .models import Movie
from django.shortcuts import render
from django.http import JsonResponse
from django.core import serializers



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
    genres = similar_to.get_genres()
    keywords = similar_to.get_keywords()
    #similar_objects = list(Movie.objects.filter(data__fields__value__regex ="b", data__fields__id= 1))
    #return JsonResponse([movies.serialize()], safe=False)
