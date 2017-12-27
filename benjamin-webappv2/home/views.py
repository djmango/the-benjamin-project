from django.shortcuts import render
from django.template import loader
# Create your views here.

def index(request):
    return render(request, 'index.html', content_type='text/html')


def commands(request):
    return render(request, 'commands.html', content_type='text/html')


def about(request):
    return render(request, 'about.html', content_type='text/html')
