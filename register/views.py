from winreg import REG_QWORD
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import login, authenticate
from .forms import RegisterForm
from django.http import HttpResponseRedirect, JsonResponse
from rating.models import Rating, Watchlist
from django.db.models import Count
from django.contrib.auth.models import User
from django.db.models import Q
from django_pivot.pivot import pivot
from movie.models import Movie
from scipy import spatial
import operator

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

def userRatings(request, user_id):
    return render(request, "register/userRatings.html")

def userRatingsAll(request, user_id):
    return render(request, "register/userRatingsAll.html")

def userWatchlist(request, user_id):
    return render(request, "register/userWatchlist.html")

def userLists(request, user_id):
    return render(request, "register/userLists.html")

def getUser(request, user_id):
    try:
        user = User.objects.get(id = user_id)
        return JsonResponse({'user_id': user_id, 'username': user.username, 'date_joined': user.date_joined})
    except Exception as error:
        print(error)

        return JsonResponse({'user_id': "null", 'username': "null", 'date_joined': "null"})

def getUserRatings(request, user_id):
    try:
        result = []
        user_ratings = list(Rating.objects.filter(user_id = user_id).order_by('tmdb_id'))
        for rating in user_ratings:
            movie = rating.tmdb_id
            movie = movie.serialize()
            movie["user_id"] = rating.user_id
            movie["user_rating"] = rating.rating
            result.append(movie)

        return JsonResponse({'user_id': user_id, 'user_ratings': result}, safe=False)

    except Exception as error:
        print(error)
        return JsonResponse({'user_id': "null", 'user_ratings': []})

def userRecommendationResponse(movies,id_list,percent_list):
    result = []
    for movie in movies:
        tmdb_id = movie.tmdb_id
        movie = movie.serialize()
        movie["shared_by_percentage"] = (percent_list[id_list.index(tmdb_id)])
        result.append(movie)
    result = sorted(result, key=lambda d: d["shared_by_percentage"], reverse=True)
    return result

def getUserRecommendations(request, user_id):
    try:
        #make a list of rated movies by the user
        user_movies = list(Rating.objects.filter(user_id = user_id).values_list('tmdb_id', flat=True).distinct().order_by('tmdb_id'))
        #take only those movies that have been rated at least 20 times
        filtered_tmdb_ids = list(Rating.objects.values_list('tmdb_id', flat=True).annotate(amount=Count('tmdb_id')).filter(tmdb_id__in = user_movies, amount__gte = 20).order_by('tmdb_id'))
        print("made filtered_tmdb_ids of size:",len(filtered_tmdb_ids))
        #create a variable for filtering user_ids
        shared = int((len(filtered_tmdb_ids))/2)

        #filter users who have watched at least half of the movies the user in question watched
        filtered_users_ids = list(Rating.objects.values_list('user_id', flat=True).annotate(amount=Count('user_id')).filter(tmdb_id__in = filtered_tmdb_ids, amount__gte = shared).order_by('user_id'))
        print("made filtered_users_ids of size:",len(filtered_users_ids))

        final_queryset = Rating.objects.filter(user_id__in = filtered_users_ids, tmdb_id__in = filtered_tmdb_ids)

        #filtering the dataset using our lists
        final_dataset = pivot(final_queryset, 'user_id', 'tmdb_id_id', 'rating', default=0)
        print("made the final_dataset! of size:",len(final_dataset))

        values_array = []

        print("Converting query_set to array...")

        #convert the query_set to array of rating arrays
        for user in final_dataset:
            array = []
            for movie in filtered_tmdb_ids:
                data = user[str(movie)]
                array.append(data)
            values_array.append(array)
            
        print("length of values_array:", len(values_array))
            
        if len(filtered_users_ids)>50:
            n_similar_users = 50
        else:
            n_similar_users = int(len(filtered_users_ids))

        user_id_list = []
        user_score_list = []

        print("Calculating nearest neighbors...")
        our_user = values_array[filtered_users_ids.index(user_id)]
        print("User",user_id,"ratings:",len(our_user))

        distances = []
        for index, value in enumerate(values_array):
            if our_user != value:
                dist = spatial.distance.cosine(our_user, value)
                distances.append((filtered_users_ids[index], dist))

        distances.sort(key=operator.itemgetter(1))
        neighbors = []
            
        for x in range(n_similar_users-1):
            neighbors.append(distances[x])

        for neighbor in neighbors:
            user_id_list.append(neighbor[0])
            user_score_list.append(neighbor[1])

        ratings_by_similar_users = Rating.objects.filter(user_id__in = user_id_list, rating__gte = 8).exclude(tmdb_id__in = filtered_tmdb_ids)

        tmdbs_ratings = [] 
        for rating in ratings_by_similar_users:
            tmdbs_ratings.append(rating.tmdb_id_id)

        counted_movies = {i:tmdbs_ratings.count(i) for i in tmdbs_ratings}
        counted_movies = sorted(counted_movies.items(), key=operator.itemgetter(1), reverse=True)

        n_movies_to_recommend = 10
        mv_id_list = []
        mv_percent_list = []

        if (len(counted_movies)>n_movies_to_recommend):
            for i in range(0,10):
                print(counted_movies[i])
                mv_id_list.append(counted_movies[i][0])
                mv_percent_list.append((counted_movies[i][1]/n_similar_users)*100)

        else:
            for movie in counted_movies:
                mv_id_list.append(counted_movies[movie][0])
                mv_percent_list.append(int((counted_movies[movie][1]/n_similar_users)*100))

        movies = list(Movie.objects.filter(tmdb_id__in=mv_id_list))
        return JsonResponse(userRecommendationResponse(movies, mv_id_list, mv_percent_list), safe=False)

    except Exception as error:
        print(error)
        return JsonResponse([], safe=False)

def getUserWatchlist(request, user_id):
    try:
        user_watchlist, created = Watchlist.objects.get_or_create(user_id=user_id)

        movies = []

        for movie in user_watchlist.movie.all():
            movie = movie.serialize()
            movies.append(movie)

        return JsonResponse({'user_id': user_id, 'user_watchlist': movies}, safe=False)
    except Exception as error:
        print(error)
        return JsonResponse([], safe=False)
