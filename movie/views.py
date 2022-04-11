from email.mime import base
from typing import final
import weakref
from django.shortcuts import get_object_or_404, render

# Create your views here.
from django.views.generic import ListView, DetailView
from numpy import moveaxis
from .models import Movie, Binary
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.db.models import Q
from rating.models import Rating, Watchlist, List
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime

from scipy import spatial
import operator
from django import template
from django.urls import reverse, resolve
from django.utils.translation import activate

def movie_list(request):
    return render(request, 'movie/movie_list.html')

def movie_detail(request, pk):
    return render(request, 'movie/movie_detail.html')

def get_popular(request, start, finish):
    movies = list(Movie.objects.all().order_by('-popularity'))[start:finish]
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def get_top(request, start, finish):
    movies = list(Movie.objects.filter(vote_count__gte = 1000).order_by('-vote_average'))[start:finish]
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def get_movie(request, pk):
    movie = Movie.objects.get(pk=pk)
    return JsonResponse([movie.serialize()], safe=False)

def get_movie_tmdb(request, tmdb):
    movie = Movie.objects.get(tmdb_id=tmdb)
    return JsonResponse([movie.serialize()], safe=False)

def search(request, term):
    #movies = list(Movie.objects.filter(title__icontains=term).order_by('-popularity'))
    return render(request, 'movie/movie_search.html')

def getSearch(request, term):
    movies = list(Movie.objects.filter(title__icontains=term).order_by('-popularity'))
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def keyword(request, keyword_name):
    return render(request, 'movie/movie_search.html')

def getKeyword(request, keyword_name):
    keyword_name = '"name":'+'"'+keyword_name+'"'
    movies = list(Movie.objects.filter(keywords__icontains=keyword_name).order_by('-popularity'))
    return JsonResponse([movie.serialize() for movie in movies], safe=False)
    
def director(request, director_name):
    return render(request, 'movie/movie_search.html')

def getDirector(request, director_name):
    movies = list(Movie.objects.filter(director__icontains=director_name).order_by('-popularity'))
    return JsonResponse([movie.serialize() for movie in movies], safe=False)

def similar_response(movies,id_list,score_list):
    result = []
    for movie in movies:
        tmdb_id = movie.tmdb_id
        movie = movie.serialize()
        movie["similarity_score"] = (score_list[id_list.index(tmdb_id)])
        result.append(movie)
    result = sorted(result, key=lambda d: d["similarity_score"])
    return result

def get_similar(request, pk):
    similar_to = Movie.objects.get(pk=pk)
    neighbors = predict_score(similar_to)

    id_list = []
    score_list = []
    print('\nContent-based recommended movies: \n')
    for neighbor in neighbors:
        print(neighbor)
        id_list.append(neighbor[0])
        score_list.append(neighbor[1])

    movies = list(Movie.objects.filter(tmdb_id__in=id_list))
    return JsonResponse(similar_response(movies, id_list, score_list), safe=False)

def predict_score(baseMovie):
    print('Selected Movie: ',baseMovie.title)
    baseMovieBin = Binary.objects.get(tmdb_id = baseMovie.tmdb_id)

    bm_genres = baseMovie.get_genres()
    bm_keywords = baseMovie.get_keywords()
    filtered_tmdb_ids = []

    genre_query = Q()
    for genre in bm_genres:
        genre_query = genre_query | Q(genres__icontains=genre)

    keyword_query = Q()
    for keyword in bm_keywords:
        keyword_query = keyword_query | Q(keywords__icontains=keyword)

    for movie in Movie.objects.filter(genre_query & keyword_query & Q(vote_count__gte=100)):
        filtered_tmdb_ids.append(movie.tmdb_id)
    
    print("Filtered movies for content-based recommendation:", len(filtered_tmdb_ids))
    
    binary_set = Binary.objects.filter(tmdb_id__in=filtered_tmdb_ids)

    def getNeighbors(K):
        distances = []
    
        #Deal with bin_str_to_list for baseMovie -- once
        baseMovieBin.genres = bin_str_tolist(baseMovieBin.genres)
        baseMovieBin.keywords = bin_str_tolist(baseMovieBin.keywords)
        baseMovieBin.directors = bin_str_tolist(baseMovieBin.directors)
        baseMovieBin.languages = bin_str_tolist(baseMovieBin.languages)

        for movie in binary_set:
            if movie.tmdb_id != baseMovie.tmdb_id:
                if "1" in movie.genres and "1" in movie.keywords and "1" in movie.directors and "1" in movie.languages:
                    dist = Similarity(baseMovieBin, movie)
                    distances.append((movie.tmdb_id, dist))

        distances.sort(key=operator.itemgetter(1))
        neighbors = []
    
        for x in range(K):
            neighbors.append(distances[x])
        return neighbors

    K = 10
    neighbors = getNeighbors(K)
    
    return neighbors

def Similarity(baseMovie, compMovie):
    genreDistance = (spatial.distance.cosine(baseMovie.genres, bin_str_tolist(compMovie.genres)))*0.5
    wordsDistance = spatial.distance.cosine(baseMovie.keywords, bin_str_tolist(compMovie.keywords))
    directorDistance = (spatial.distance.cosine(baseMovie.directors, bin_str_tolist(compMovie.directors)))*0.3
    languageDistance = (spatial.distance.cosine(baseMovie.languages, bin_str_tolist(compMovie.languages)))*0.2
    return (genreDistance + wordsDistance + directorDistance + languageDistance)/2

def bin_str_tolist(binary_string):
    binary_string = binary_string.replace(",","")
    binary_list = []
    for char in binary_string:
        binary_list.append(int(char))
    return binary_list

def getRating(request, tmdb_id):
    if request.user.is_authenticated:
        current_user = request.user
        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
            query = Rating.objects.get(user_id=current_user.id, tmdb_id = movie)
            print("Query exists")
            rating = query.rating
        except Rating.DoesNotExist:
            print("Query does not exist")
            rating = "null"
        return JsonResponse({'user_id': current_user.id, 'user_rating': rating})
    else:
        return JsonResponse({'user_id': "null", 'user_rating': "null"})

@csrf_exempt
def addRating(request, tmdb_id, rating):
    if request.method == "POST":
        print("Add Rating: ",tmdb_id, rating)
        if request.user.is_authenticated:
            current_user = request.user
            try:
                movie = Movie.objects.get(tmdb_id=tmdb_id)
                query = Rating.objects.get(user_id=current_user.id, tmdb_id = movie)
                print("Changed rating from "+str(query.rating)+" to "+str(rating))
                query.rating = rating
                query.timestamp = datetime.now()
                query.save()
            except Rating.DoesNotExist:
                print("Rating does not exist")
                Rating.objects.create(user_id=current_user.id, tmdb_id = movie, rating=rating, timestamp=datetime.now())

            return JsonResponse({'user_id': current_user.id, 'user_rating': rating})
                
        else:
            return JsonResponse({'user_id': "null", 'user_rating': "null"})

@csrf_exempt
def removeRating(request, tmdb_id):
    if request.method == "POST":
        print("Remove Rating: ",tmdb_id)
        if request.user.is_authenticated:
            current_user = request.user
            try:
                movie = Movie.objects.get(tmdb_id=tmdb_id)
                query = Rating.objects.get(user_id=current_user.id, tmdb_id = movie)
                query.delete()
                print("Removed rating from "+str(query.rating)+" of user "+ str(current_user.id) + " of movie " + str(movie.title))
            except Rating.DoesNotExist:
                print("Rating does not exist")

            return JsonResponse({'user_id': current_user.id, 'user_rating': "remove"})
                
        else:
            return JsonResponse({'user_id': "null", 'user_rating': "null"})

def checkIfInWatchlist(request, tmdb_id):
    if request.user.is_authenticated:
        current_user = request.user
        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
            if Watchlist.objects.filter(user_id=current_user.id, movie=movie).exists():
                print("User",current_user.id, "watchlist exists")
                watchlist = True
            else:
                watchlist = False

        except Exception as error:
            print(error)
            watchlist = False
            
        return JsonResponse({'user_id': current_user.id, 'in_watchlist': watchlist})
    else:
        return JsonResponse({'user_id': "null", 'in_watchlist': "null"})

@csrf_exempt
def addToWatchlist(request, user_id, tmdb_id):
    print("Entered addToWatchlist")
    if request.method == "POST":
        print("request.method == 'POST'")
        movie = get_object_or_404(Movie, tmdb_id=tmdb_id)

        # Check if the item already exists in that user watchlist
        if Watchlist.objects.filter(user_id=user_id, movie=movie).exists():
            print("Already in the watchlist - removing...")
            query = Watchlist.objects.get(user_id=user_id, movie=movie)
            query.movie.remove(movie)

            return JsonResponse({'user_id': user_id, 'removed_from_watchlist': tmdb_id})
        else:        
            # Get the user watchlist or create it if it doesn't exists
            user_watchlist, created = Watchlist.objects.get_or_create(user_id=user_id)
            # Add the item through the ManyToManyField (Watchlist => item)
            user_watchlist.movie.add(movie)

            return JsonResponse({'user_id': user_id, 'added_to_watchlist': tmdb_id})
    else:
        print("request.method != 'POST'")

@csrf_exempt
def addTolist(request, user_id, tmdb_id, list_id):
    if request.method == "POST":
        movie = get_object_or_404(Movie, tmdb_id=tmdb_id)

        # Check if the item already exists in that user watchlist
        if List.objects.filter(id=list_id, user_id=user_id, movie=movie).exists():
            print("Already in the watchlist - removing...")
            query = List.objects.get(id=list_id, user_id=user_id, movie=movie)
            query.movie.remove(movie)

            return JsonResponse({'user_id': user_id, 'removed_from_list': list_id, 'movie of tmdb_id': tmdb_id})
        else:        
            # Get the user list or create it if it doesn't exists
            user_list = List.objects.get(id=list_id, user_id=user_id)
            # Add the item through the ManyToManyField (Watchlist => item)
            user_list.movie.add(movie)

            return JsonResponse({'user_id': user_id, 'added_to_list': list_id, 'movie of tmdb_id': tmdb_id})

from django_pivot.pivot import pivot
from django.db.models import Count

def collabRecommendation(request, tmdb_id):
    print("Starting Collaborative Recommendation of movie tmdb_id: "+str(tmdb_id))
    selected_movie = Movie.objects.get(tmdb_id=tmdb_id)
    min_movie_ratings = 10
    #make a list of only tmdb ids of movies who were rated at least x=(min_movie_ratings) times
    no_users_voted = (Rating.objects.values_list('tmdb_id').annotate(ratings=Count('tmdb_id')).filter(ratings__gte=min_movie_ratings).order_by('tmdb_id'))
    print("Length of no_users_voted:",len(no_users_voted))
    #check if the movie was rated considering min_movie_ratings
    movie_in_ratings = False
    for i in no_users_voted:
        if (tmdb_id == i[0]):
            movie_in_ratings = True
            break
    
    if(movie_in_ratings == True):
        #make a list of only user ids of users who liked the requested movie:
        rating_val=6
        users_who_liked = list(Rating.objects.filter(tmdb_id=tmdb_id, rating__gte=rating_val).values_list('user_id', flat = True).order_by('user_id'))
        while(len(users_who_liked) > 1500):
            if(rating_val>=9):
                users_who_liked = list(Rating.objects.values_list('user_id', flat=True).annotate(ratings=Count('user_id')).filter(tmdb_id=tmdb_id, rating__gte=rating_val).order_by('-ratings')[:1500])
            else:
                rating_val += 1
                users_who_liked = list(Rating.objects.filter(tmdb_id=tmdb_id, rating__gte=rating_val).values_list('user_id', flat = True).order_by('user_id'))

            print("WHILE(Length of users_who_liked:",len(users_who_liked),")")

        print("Length of users_who_liked:",len(users_who_liked))
        users_who_liked.sort()
        #make a list of genres to make the final_dataset more accurate and smaller
        try:
            print("filtering by genres and keywords...")
            bm_genres = selected_movie.get_genres()
            bm_keywords = selected_movie.get_keywords()

            query1 = Q()
            for genre in bm_genres:
                query1 = query1 | Q(genres__icontains=genre)

            filtered_tmdb_ids = []
            
            for movie in Movie.objects.filter(query1):
                shared_keywords = 0
                for keyword in movie.get_keywords():
                    for bm_keyword in bm_keywords:
                        if keyword == bm_keyword:
                            shared_keywords += 1
                
                if(shared_keywords >= 1):
                    filtered_tmdb_ids.append(movie.tmdb_id)
    
            filter3 = Q(tmdb_id__in = filtered_tmdb_ids)
            filter4 = Q(user_id__in = users_who_liked)

            print("length of filtered_tmdb_list:", len(filtered_tmdb_ids))

            #filtering the dataset using our lists
            final_dataset = pivot(Rating.objects.filter(filter3 & filter4), 'tmdb_id_id', 'user_id', 'rating', default=0)
            print("made the final_dataset! of size:",len(final_dataset))

            values_array = []

            print("Converting query_set to array...")

            #convert the query_set to array of rating arrays and update the movie ids
            filtered_tmdb_ids = []
            for movie in final_dataset:
                filtered_tmdb_ids.append(movie['tmdb_id_id'])
                array = []
                for user in users_who_liked:
                    data = movie[str(user)]
                    array.append(data)
                values_array.append(array)
            
            print("length of values_array:", len(values_array))
            
            n_movies_to_recommend = 10
            id_list = []
            score_list = []

            print("Calculating nearest neighbors V2...")
            our_movie = values_array[filtered_tmdb_ids.index(tmdb_id)]

            distances = []
            #our_movie_avg = sum(our_movie)/len(our_movie)
            #print("Our Movie average vote:",our_movie_avg)
            for index, value in enumerate(values_array):
                if our_movie != value:
                    ratings = []
                    for rating in value:
                        if (rating != 0):
                            ratings.append(rating)
                    rating_avg = sum(ratings)/len(ratings)
                    percent_of_users = (len(ratings)/len(users_who_liked))*100

                    if(percent_of_users>10 and rating_avg>5):
                        #print("Rating average of:",filtered_tmdb_ids[index],":",rating_avg,"similarity:",spatial.distance.cosine(our_movie, value), "percent:", percent_of_users)
                        dist = (spatial.distance.cosine(our_movie, value) + (10-rating_avg)/5)/2
                        #dist = (spatial.distance.euclidean(our_movie, value))
                        distances.append((filtered_tmdb_ids[index], dist))

            distances.sort(key=operator.itemgetter(1))
            neighbors = []

            if(len(distances)<n_movies_to_recommend):
                for x in range(len(distances)):
                    neighbors.append(distances[x])
            else:
                for x in range(n_movies_to_recommend):
                    neighbors.append(distances[x])
            
            for neighbor in neighbors:
                print(neighbor)
                id_list.append(neighbor[0])
                score_list.append(neighbor[1])

            movies = list(Movie.objects.filter(tmdb_id__in=id_list))
            return JsonResponse(similar_response(movies, id_list, score_list), safe=False)

        except Exception as error:
            print(error)
            return JsonResponse([], safe=False)
    else:
        print("Not one rating for this movie exists in the database")
        return JsonResponse([], safe=False)