"""inz URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include 
from django.conf import settings
from django.conf.urls.static import static
from register import views as v
from django.conf.urls.i18n import i18n_patterns
from django.views.i18n import JavaScriptCatalog


app_name = 'inz'

urlpatterns = i18n_patterns(
    path('jsi18n/', JavaScriptCatalog.as_view(domain="django"), name='javascript-catalog'),
    path('admin/', admin.site.urls),
    path('register/', v.register, name="register"),
    path('', include('movie.urls', namespace='movies_name')),
    path('', include("django.contrib.auth.urls")),
    path('', include('register.urls', namespace='registers_name')),
    prefix_default_language=True,
)

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)