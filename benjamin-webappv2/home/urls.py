from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('commands', views.commands, name='commands'),
    path('about', views.about, name='about')
]
