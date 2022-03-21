from movie.models import Movie
from rating.models import Rating
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Calculates average ratings for every movie in the database'

    def handle(self, *args, **options):
        try:
            all_movies = Movie.objects.all()
            for movie in all_movies:
                if (movie.runtime != "null" and movie.release_date):
                    ratings = list(Rating.objects.filter(tmdb_id=movie).values_list('rating', flat=True))
                    votes = len(ratings)
                    if (votes>0):
                        average_rating = sum(ratings)/votes
                        print(movie.title,":",len(ratings),"ratings // old_rating:",movie.vote_average," // new_rating:",round(average_rating, 1))
                        movie.vote_average = round(average_rating, 1)
                        movie.vote_count = votes
                    else:
                        movie.vote_average = 0
                        movie.vote_count = votes
                    movie.save()
        except Exception as e:
            raise CommandError('Something went wrong:',e)