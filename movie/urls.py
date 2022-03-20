from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.movie_list, name="movie_list"),
    path('details/<int:pk>',  views.movie_detail, name="movie_detail"),
    path('get_popular', views.get_popular, name="get_popular"),
    path('get_movie/<int:pk>', views.get_movie, name="get_movie"),
    path('search/<str:term>', views.search, name="search"),
    path('get_similar/<int:pk>', views.get_similar, name="get_similar"),
] 