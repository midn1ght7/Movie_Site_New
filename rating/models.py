from django.db import models
from movie.models import Movie

class Rating(models.Model):
    user_id = models.IntegerField()
    tmdb_id = models.ForeignKey(Movie, to_field="tmdb_id", db_column="tmdb_id", on_delete=models.CASCADE)
    rating = models.IntegerField()

    def __str__(self):
        return "User ID: "+str(self.user_id)+" TMDB ID: "+str(self.tmdb_id.tmdb_id)+" Rating: "+str(self.rating)

    def serialize(self):
        return {
            "id": self.id,         
            "user_id": self.user_id,
            "tmdb_id": self.tmdb_id.tmdb_id,
            "rating": self.rating
        }

# class Watchlist(models.model):
#     user_id = models.IntegerField()
#     tmdb_id = models.ForeignKey(Movie, to_field="tmdb_id", db_column="tmdb_id", on_delete=models.CASCADE)

#     def __str__(self):
#         return "User ID: "+str(self.user_id)+" TMDB ID: "+str(self.tmdb_id.tmdb_id)

#     def serialize(self):
#         return {
#             "id": self.id,         
#             "user_id": self.user_id,
#             "tmdb_id": self.tmdb_id.tmdb_id
#         }

# class List(models.Model):
#     user_id = models.IntegerField()
#     list_id = models.IntegerField()
#     list_name = 
#     movie = models.ForeignKey(Movie, to_field="tmdb_id", db_column="tmdb_id", on_delete=models.CASCADE)