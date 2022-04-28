from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import login, authenticate
from .forms import RegisterForm, ListForm
from django.http import HttpResponseRedirect, JsonResponse
from rating.models import Rating, Watchlist, List
from django.db.models import Count
from django.contrib.auth.models import User
from django.db.models import Q
from django_pivot.pivot import pivot
from movie.models import Movie
from scipy import spatial
import operator
from django.views.decorators.csrf import csrf_exempt

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

def userRatings(request, user_id):
    return render(request, "register/userRatings.html")

def userWatchlist(request, user_id):
    return render(request, "register/userWatchlist.html")

def createListPage(request):
    if request.method == "POST":
        form = ListForm(request.POST)
        if form.is_valid():
            new_list = List.objects.create(
                name = form.cleaned_data['name'],
                user_id = request.user.id,
            )
            new_list.save()
            return redirect("/user/"+str(request.user.id)+"/lists")
    else:
        form = ListForm()
        return render(request, "register/createList.html", {"form":form})

def editListPage(request, list_id):
    if request.method == "POST":
        form = ListForm(request.POST)
        if form.is_valid():
            edit_list = List.objects.get(id = list_id, user_id = request.user.id)
            edit_list.name = form.cleaned_data['name']
            edit_list.save()
            return redirect("/user/"+str(request.user.id)+"/lists")
    else:
        form = ListForm()
        return render(request, "register/editList.html", {"form":form})

@csrf_exempt
def deleteList(request, list_id):
    if request.method == "POST":
        list_object = get_object_or_404(List, id=list_id)
        list_object.delete()
        return JsonResponse({'user_id': request.user.id, 'removed_list': list_id})


def userLists(request, user_id):
    return render(request, "register/userLists.html")

def userListSpecific(request, user_id, list_id):
    return render(request, "register/userListSpecific.html")

def getUser(request, user_id):
    try:
        user = User.objects.get(id = user_id)
        return JsonResponse({'user_id': user_id, 'username': user.username, 'date_joined': user.date_joined})
    except Exception as error:
        print(error)

        return JsonResponse({'user_id': "null", 'username': "null", 'date_joined': "null"})

def getList(request, list_id):
    try:
        list_object = List.objects.get(id = list_id)
        movies = []
        for movie in list_object.movie.all():
            movie = movie.serialize()
            movies.append(movie)

        return JsonResponse({'id': list_object.id, 'name': list_object.name, 'movies': movies}, safe=False)
    except Exception as error:
        print(error)
        return JsonResponse([], safe=False)

def getUserRatings(request, user_id):
    try:
        result = []
        user_ratings = list(Rating.objects.filter(user_id = user_id).order_by('-timestamp'))
        for rating in user_ratings:
            movie = rating.tmdb_id
            movie = movie.serialize()
            movie["user_id"] = rating.user_id
            movie["user_rating"] = rating.rating
            movie["user_rating_timestamp"] = rating.timestamp
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

def test(request, user_id):
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

        ratings_by_similar_users = Rating.objects.filter(user_id__in = user_id_list, rating__gte = 7).exclude(tmdb_id__in = filtered_tmdb_ids)

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

        ratings_by_similar_users = Rating.objects.filter(user_id__in = user_id_list, rating__gte = 7).exclude(tmdb_id__in = filtered_tmdb_ids)

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

        ratings_by_similar_users = Rating.objects.filter(user_id__in = user_id_list, rating__gte = 7).exclude(tmdb_id__in = filtered_tmdb_ids)

        tmdbs_ratings = [] 
        for rating in ratings_by_similar_users:
            tmdbs_ratings.append(rating.tmdb_id_id)

        counted_movies = {i:tmdbs_ratings.count(i) for i in tmdbs_ratings}
        counted_movies = sorted(counted_movies.items(), key=operator.itemgetter(1), reverse=True)

        print(counted_movies)

        n_movies_to_recommend = 10
        mv_id_list = []
        mv_percent_list = []

        if (len(counted_movies)>n_movies_to_recommend):
            for i in range(0,10):
                #print(counted_movies[i])
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

def getUserLists(request, user_id):
    try:
        user_lists = list(List.objects.filter(user_id=user_id))
        lists = []
        for list_item in user_lists:
            list_json = {'id': list_item.id, 'name': list_item.name}
            
            movies = []
            for movie in list_item.movie.all():
                movie = movie.serialize()
                movies.append(movie)
            
            list_json['movies'] = movies
            lists.append(list_json)
        return JsonResponse({'user_id': user_id, 'user_lists': lists}, safe=False)
    except Exception as error:
        print(error)
        return JsonResponse([], safe=False)


from collections import Counter
from movie.models import Binary

def getListRecommendations(request, list_id):
    list_obj = List.objects.get(id=list_id)
    tmdb_ids = list(list_obj.movie.all().values_list('tmdb_id', flat=True).order_by('tmdb_id'))
    genres = []
    keywords = []

    for movie in list_obj.movie.all():
        for genre in movie.genres:
            genres.append(genre['name'])
        for keyword in movie.keywords["keywords"]:
            keywords.append(keyword['name'])
        
    binary_objects = Binary.objects.filter(tmdb_id__in=tmdb_ids)

    genre_bin_lists = []
    keywords_bin_lists = []
    directors_bin_lists = []
    languages_bin_lists = []
    for movie_bin in binary_objects:
        genre_bin_list = bin_str_tolist(movie_bin.genres)
        genre_bin_lists.append(genre_bin_list)
        keywords_bin_list = bin_str_tolist(movie_bin.keywords)
        keywords_bin_lists.append(keywords_bin_list)
        directors_bin_list = bin_str_tolist(movie_bin.directors)
        directors_bin_lists.append(directors_bin_list)
        languages_bin_list = bin_str_tolist(movie_bin.languages)
        languages_bin_lists.append(languages_bin_list)
        

    genres_bin = genre_bin_lists[0]
    keywords_bin = keywords_bin_lists[0]
    directors_bin = directors_bin_lists[0]
    languages_bin = languages_bin_lists[0]

    #Adding same occurences
    def fuse_binary_lists(base_list, list_of_lists):
        for list_obj in list_of_lists[1:]:
            for i, item in enumerate(list_obj):
                base_list[i] += item

    fuse_binary_lists(genres_bin, genre_bin_lists)
    fuse_binary_lists(keywords_bin, keywords_bin_lists)
    fuse_binary_lists(directors_bin, directors_bin_lists)
    fuse_binary_lists(languages_bin, languages_bin_lists)

    fusedBin = Binary(id=0, tmdb_id=0, genres=genres_bin, keywords = keywords_bin, directors = directors_bin, languages = languages_bin)

    filtered_tmdb_ids = []

    genre_query = Q()
    for genre in genres:
        genre_query = genre_query | Q(genres__icontains=genre)

    keyword_query = Q()
    for keyword in keywords:
        keyword_query = keyword_query | Q(keywords__icontains=keyword)

    for movie in Movie.objects.filter(genre_query & keyword_query & Q(vote_count__gte=100)):
        filtered_tmdb_ids.append(movie.tmdb_id)

    print("Filtered movies for content-based recommendation:", len(filtered_tmdb_ids))

    binary_set = Binary.objects.filter(tmdb_id__in=filtered_tmdb_ids)

    def getNeighbors(K):
        distances = []
    
        for movie in binary_set:
            if movie.tmdb_id not in tmdb_ids:
                if "1" in movie.genres and "1" in movie.keywords and "1" in movie.directors and "1" in movie.languages:
                    dist = Similarity(fusedBin, movie)
                    #print(dist)
                    distances.append((movie.tmdb_id, dist))
        
        distances.sort(key=operator.itemgetter(1))
        neighbors = []
        
    
        for x in range(K):
            neighbors.append(distances[x])
        return neighbors

    K = 10
    neighbors = getNeighbors(K)

    id_list = []
    score_list = []
    print('\nContent-based recommended movies: \n')
    for neighbor in neighbors:
        id_list.append(neighbor[0])
        score_list.append(neighbor[1])

    movies = list(Movie.objects.filter(tmdb_id__in=id_list))
    return JsonResponse(similar_response(movies, id_list, score_list), safe=False)


def Similarity(baseMovie, compMovie):
    genreDistance = (spatial.distance.cosine(baseMovie.genres, multiply_binaries(baseMovie.genres,bin_str_tolist(compMovie.genres))))*0.5
    wordsDistance = spatial.distance.cosine(baseMovie.keywords, multiply_binaries(baseMovie.keywords,bin_str_tolist(compMovie.keywords)))
    directorDistance = (spatial.distance.cosine(baseMovie.directors, multiply_binaries(baseMovie.directors,bin_str_tolist(compMovie.directors))))*0.3
    languageDistance = (spatial.distance.cosine(baseMovie.languages, multiply_binaries(baseMovie.languages,bin_str_tolist(compMovie.languages))))*0.2
    return (genreDistance + wordsDistance + directorDistance + languageDistance)/2

def bin_str_tolist(binary_string):
    binary_string = binary_string.replace(",","")
    binary_list = []
    for char in binary_string:
        binary_list.append(int(char))
    return binary_list

def multiply_binaries(base_binary_list, comp_binary_list):
    for i, item in enumerate(base_binary_list):
        if item != 0:
            comp_binary_list[i] = comp_binary_list[i] * item
    return comp_binary_list

def similar_response(movies,id_list,score_list):
    result = []
    for movie in movies:
        tmdb_id = movie.tmdb_id
        movie = movie.serialize()
        movie["similarity_score"] = (score_list[id_list.index(tmdb_id)])
        result.append(movie)
    result = sorted(result, key=lambda d: d["similarity_score"])
    return result



