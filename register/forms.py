from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib.auth.models import User
from rating.models import List
from django.utils.translation import gettext, gettext_lazy


class RegisterForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

class ListForm(forms.ModelForm):
    class Meta:
        model = List
        fields = ["name"]
        labels = {'name': gettext_lazy("list-name")}