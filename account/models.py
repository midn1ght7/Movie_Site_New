from django.db import models
from django.contrib.auth.models import User
import jsonfield
from django.core.exceptions import ObjectDoesNotExist

class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    ratings = jsonfield.JSONField()

    def has_related_object(self):
        try:
            self.user
            self.ratings
            return True
        except ObjectDoesNotExist:
            return False

    def __str__(self):
        return self.user.username