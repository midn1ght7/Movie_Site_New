from winreg import REG_QWORD
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from .forms import RegisterForm
from django.http import HttpResponseRedirect, JsonResponse
from rating.models import Rating
from django.db.models import Count

# Create your views here.

def register(response):
    if response.method == 'POST':
        form = RegisterForm(response.POST)
        if form.is_valid():
            form.save()
            
        return redirect("/")
    else:
        form = RegisterForm()

    return render(response, "register/register.html", {"form":form})

def user(request):
    return render(request, "register/user.html")

def getUser(request):
    if request.user.is_authenticated:
        current_user = request.user
        user_ratings = list(Rating.objects.filter(user_id = request.user.id).order_by('-tmdb_id'))
        user_ratings = [rating.serialize() for rating in user_ratings]
        return JsonResponse({'user_id': current_user.id, 'username': current_user.username, 'date_joined': current_user.date_joined, 'user_ratings': user_ratings})
    else:
        return JsonResponse({'user_id': "null"})

def getUserRecommendations(request):
    if request.user.is_authenticated:
        current_user = request.user
        user_ratings = list(Rating.objects.filter(user_id = request.user.id).order_by('-tmdb_id'))
        user_ratings = [rating.serialize() for rating in user_ratings]

        #make a list of only user ids of users who voted at least x=(min_user_ratings) times
        no_movies_voted = (Rating.objects.values('user_id').annotate(ratings=Count('user_id')).filter(ratings__gte=25).values_list('user_id').order_by())

        


        return JsonResponse([], safe=False)
    else:
        return JsonResponse([], safe=False)