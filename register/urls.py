from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('user/<int:user_id>/ratings', views.userRatings, name="userRatings_page"),
    path('user/<int:user_id>/ratings/all', views.userRatingsAll, name="userRatingsAll_page"),
    path('getUser/<int:user_id>', views.getUser, name="getUser"),
    path('getUserRatings/<int:user_id>', views.getUserRatings, name="getUserRatings"),
    path('getUserRecommendations/<int:user_id>', views.getUserRecommendations, name="getUserRecommendations"),
] 