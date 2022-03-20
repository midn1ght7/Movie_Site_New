from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('user/', views.user, name="user_page"),
    path('getUser/', views.getUser, name="getUser"),
] 