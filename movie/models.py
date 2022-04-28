from django.db import models
import jsonfield
from django.contrib.auth.models import User
from django.conf import settings

# Create your models here.

class Movie(models.Model):
    #adult = models.BooleanField(default=False)
    tmdb_id = models.IntegerField(unique=True)
    backdrop = models.ImageField(upload_to='backdrops')
    #belongs_to_collection
    budget = models.IntegerField()
    director = models.CharField(max_length=100)
    genres = jsonfield.JSONField()
    #homepage
    #imdb_id
    keywords = jsonfield.JSONField()
    original_language = models.CharField(max_length=10)
    original_title = models.CharField(max_length=100)
    overview = models.TextField(max_length=1000, blank=True, null=True)
    popularity = models.FloatField()
    poster = models.ImageField(upload_to='posters')
    production_company = models.CharField(max_length=100)
    #production_countries
    release_date = models.DateField()
    revenue = models.IntegerField()
    runtime = models.IntegerField()
    #spoken_languages
    status = models.CharField(max_length=50)
    tagline = models.TextField(max_length=1000, blank=True, null=True)
    title = models.CharField(max_length=100)
    #video##
    vote_average = models.FloatField()
    vote_count = models.IntegerField()

    def __str__(self):
        return self.title

    def serialize(self):
        return {
            "id": self.id,
            "tmdb_id": self.tmdb_id,
            "backdrop": str(self.backdrop),
            "budget": self.budget,
            "director": self.director,
            "genres": self.genres,
            "keywords": self.keywords,
            "original_language": self.original_language,
            "original_title": self.original_title,
            "overview": self.overview,
            "popularity": self.popularity,
            "poster": str(self.poster),
            "production_company": self.production_company,
            "release_date": self.release_date,
            "revenue": self.revenue,
            "runtime": self.runtime,
            "status": self.status,
            "tagline": self.tagline,
            "title": self.title,
            "vote_average": self.vote_average,
            "vote_count": self.vote_count
        }

    def get_genres(self):
        genre_list = [genre["name"] for genre in self.genres]
        #print(genre_list)
        return genre_list
    
    def get_keywords(self):
        keyword_list = [keyword["name"] for keyword in self.keywords["keywords"]]
        #print(keyword_list)
        return keyword_list

class Binary(models.Model):
    tmdb_id = models.IntegerField()
    genres = models.TextField()
    keywords = models.TextField()
    directors = models.TextField()
    languages = models.TextField()
