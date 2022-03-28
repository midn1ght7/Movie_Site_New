from django.contrib import admin
from django.urls import path
from . import views
app_name = 'registers'

urlpatterns = [
    path('user/<int:user_id>', views.user, name="user_page"),
    path('user/<int:user_id>/ratings', views.userRatings, name="userRatings_page"),
    path('user/<int:user_id>/watchlist', views.userWatchlist, name="userWatchlist_page"),
    path('user/<int:user_id>/lists', views.userLists, name="userLists_page"),
    path('user/<int:user_id>/list/<int:list_id>', views.userListSpecific, name="userListSpecific_page"),
    path('getUser/<int:user_id>', views.getUser, name="getUser"),
    path('getUserRatings/<int:user_id>', views.getUserRatings, name="getUserRatings"),
    path('getUserRecommendations/<int:user_id>', views.getUserRecommendations, name="getUserRecommendations"),
    path('getUserWatchlist/<int:user_id>', views.getUserWatchlist, name="getUserWatchlist"),
    path('list/create', views.createListPage, name="createList_page"),
    path('list/edit/<int:list_id>', views.editListPage, name="editList_page"),
    path('list/delete/<int:list_id>', views.deleteList, name="deleteList"),
    path('getUserLists/<int:user_id>', views.getUserLists, name="getUserLists"),
    path('getList/<int:list_id>', views.getList, name="getList"),
    path('getListRecommendations/<int:list_id>', views.getListRecommendations, name="getListRecommendations"),
] 