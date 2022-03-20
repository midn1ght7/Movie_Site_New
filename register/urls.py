from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('user/<int:user_id>', views.user, name="user_page"),
    path('getUser/<int:user_id>', views.getUser, name="getUser"),
    path('getUserRatings/<int:user_id>', views.getUserRatings, name="getUserRatings"),
    path('getUserRecommendations/<int:user_id>', views.getUserRecommendations, name="getUserRecommendations"),
] 