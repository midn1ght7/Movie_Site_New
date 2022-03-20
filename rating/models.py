from django.db import models

class Rating(models.Model):
    user_id = models.IntegerField()
    tmdb_id = models.IntegerField()
    rating = models.IntegerField()

    def __str__(self):
        return "User ID: "+str(self.user_id)+" TMDB ID: "+str(self.tmdb_id)+" Rating: "+str(self.rating)

    def serialize(self):
        return {
            "id": self.id,         
            "user_id": self.user_id,
            "tmdb_id": self.tmdb_id,
            "rating": self.rating
        }