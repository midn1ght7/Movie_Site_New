from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.movie_list, name="movie_list"),
    path('details/<int:pk>',  views.movie_detail, name="movie_detail"),
    path('get_popular/<int:start>/<int:finish>', views.get_popular, name="get_popular"),
    path('get_top/<int:start>/<int:finish>', views.get_top, name="get_top"),
    path('get_movie/<int:pk>', views.get_movie, name="get_movie"),
    path('get_movie_tmdb/<int:tmdb>', views.get_movie_tmdb, name="get_movie_tmdb"),
    path('search/<str:term>', views.search, name="search"),
    path('getSearch/<str:term>', views.getSearch, name="getSearch"),
    path('get_similar/<int:pk>', views.get_similar, name="get_similar"),
    path('collabRecommendation/<int:tmdb_id>', views.collabRecommendation, name="collabRecommendation"),
    path('getRating/<int:tmdb_id>', views.getRating, name="getRating"),
    path('addRating/<int:tmdb_id>/<int:rating>', views.addRating, name="addRating"),
    path('removeRating/<int:tmdb_id>', views.removeRating, name="removeRating"),
    path('checkIfInWatchlist/<int:tmdb_id>', views.checkIfInWatchlist, name="checkIfInWatchlist"),
    path('addToWatchlist/<int:user_id>/<int:tmdb_id>', views.addToWatchlist, name="addToWatchlist"),
] 