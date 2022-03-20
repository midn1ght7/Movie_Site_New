from winreg import REG_QWORD
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from .forms import RegisterForm
from django.http import HttpResponseRedirect, JsonResponse
from rating.models import Rating
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

def user(request, user_id):
    return render(request, "register/user.html")

def getUser(request, user_id):
    try:
        user = User.objects.get(id = user_id)
        return JsonResponse({'user_id': user_id, 'username': user.username, 'date_joined': user.date_joined})
    except Exception as error:
        print(error)
        return JsonResponse({'user_id': "null"})

def getUserRatings(request, user_id):
    try:
        user_ratings = list(Rating.objects.filter(user_id = user_id).order_by('-tmdb_id'))
        user_ratings = [rating.serialize() for rating in user_ratings]
        return JsonResponse({'user_id': user_id, 'user_ratings': user_ratings})

    except Exception as error:
        print(error)
        return JsonResponse({'user_id': "null"})

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
        user_ratings = Rating.objects.filter(user_id = user_id).order_by('-tmdb_id')
        #filter users who have watched at least half of the movies the user in question watched
        ur_count = user_ratings.count()
        if(ur_count < 20):
            shared = ur_count
        else:
            shared = int((ur_count)/2)
        print("Minimum shared movie ratings:", shared)
        #make a list of rated movies by the user

        filtered_tmdb_ids = list(user_ratings.values_list('tmdb_id', flat=True).distinct())
        print("made filtered_tmdb_ids of size:",len(filtered_tmdb_ids))

        # filtered_tmdb_ids = []
        # for movie in user_ratings:
        #     filtered_tmdb_ids.append(movie.tmdb_id)

        filtered_users_ids = list(Rating.objects.values_list('user_id', flat=True).annotate(amount=Count('user_id')).filter(tmdb_id__in = filtered_tmdb_ids, amount__gte = shared).order_by('-amount'))
        #for user in users:
            #print(user)

        #filtered_users_ids = list(operator.itemgetter(*'user_id')(users))

        # filtered_users_ids = []
        # for user in users:
        #     print(user)
        #     filtered_users_ids.append(user['user_id'])

        print("made filtered users of size:",len(filtered_users_ids))

        final_queryset = Rating.objects.filter(user_id__in = filtered_users_ids, tmdb_id__in = filtered_tmdb_ids)

        movies_ids = list(final_queryset.order_by().values_list('tmdb_id', flat=True).distinct())
        user_ids = list(final_queryset.order_by().values_list('user_id', flat=True).distinct())

        print("User Ids size:",len(user_ids))

        #filtering the dataset using our lists
        final_dataset = pivot(final_queryset, 'user_id', 'tmdb_id_id', 'rating', default=0)
        print("made the final_dataset! of size:",len(final_dataset))

        values_array = []

        # movies_ids = []
        # user_ids = []

        # for label in final_dataset.values(): 
        #     #print (label);
        #     if(label['tmdb_id_id'] not in movies_ids):
        #         movies_ids.append(label['tmdb_id_id'])
        #     if(label['user_id'] not in user_ids):
        #         user_ids.append(label['user_id'])

        # print("length of movies_ids:", len(movies_ids))
        # print("length of user_ids:", len(user_ids))

        print("Converting query_set to array...")

        #convert the query_set to array of rating arrays
        for user in final_dataset:
            array = []
            for movie in movies_ids:
                data = user[str(movie)]
                array.append(data)
            values_array.append(array)
            
        print("length of values_array:", len(values_array))

        # for index, value in enumerate(values_array):
        #     if(user_ids[index] == 3 or user_ids[index] == 66201 or user_ids[index] == 110847):
        #             print(user_ids[index],":", value)
            
        if len(user_ids)>50:
            n_similar_users = 50
        else:
            n_similar_users = int(len(user_ids))

        user_id_list = []
        user_score_list = []

        print("Calculating nearest neighbors...")
        #print("User ID:",user_id)
        #print("Index of user ID:",user_ids.index(user_id))
        #print("User ID:",user_ids[user_ids.index(user_id)])
        our_user = values_array[user_ids.index(user_id)]
        print("User",user_id,"ratings:",len(our_user))

        distances = []
        for index, value in enumerate(values_array):
            if our_user != value:
                #print(index)
                #print(user_ids[index])
                
                dist = spatial.distance.cosine(our_user, value)
                distances.append((user_ids[index], dist))

        distances.sort(key=operator.itemgetter(1))
        neighbors = []
            
        for x in range(n_similar_users-1):
            neighbors.append(distances[x])

        for neighbor in neighbors:
            print(neighbor)
            user_id_list.append(neighbor[0])
            user_score_list.append(neighbor[1])

        ratings_by_similar_users = Rating.objects.filter(user_id__in = user_id_list, rating__gte = 8).exclude(tmdb_id__in = movies_ids)

        tmdbs_ratings = [] 
        for rating in ratings_by_similar_users:
            tmdbs_ratings.append(rating.tmdb_id_id)

        counted_movies = {i:tmdbs_ratings.count(i) for i in tmdbs_ratings}
        counted_movies = sorted(counted_movies.items(), key=operator.itemgetter(1), reverse=True)
        #print(counted_movies)

        n_movies_to_recommend = 10
        mv_id_list = []
        mv_percent_list = []

        if (len(counted_movies)>n_movies_to_recommend):
            for i in range(0,10):
                print(counted_movies[i])
                mv_id_list.append(counted_movies[i][0])
                mv_percent_list.append((counted_movies[i][1]/n_similar_users)*100)
                #print(counted_movies[movie][0])

        else:
            for movie in counted_movies:
                mv_id_list.append(counted_movies[movie][0])
                mv_percent_list.append(int((counted_movies[movie][1]/n_similar_users)*100))

        movies = list(Movie.objects.filter(tmdb_id__in=mv_id_list))
        return JsonResponse(userRecommendationResponse(movies, mv_id_list, mv_percent_list), safe=False)

    except Exception as error:
        print(error)
        return JsonResponse([], safe=False)