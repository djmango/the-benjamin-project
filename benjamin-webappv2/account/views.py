from django.shortcuts import render, redirect
from django.http import HttpResponse
# Create your views here.
def index(request):
    return HttpResponse("Hello, world. Welcome to account index.")
def login(request):
    return HttpResponse("HI IT WORKED")