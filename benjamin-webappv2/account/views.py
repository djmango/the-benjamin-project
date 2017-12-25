from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpRequest
from requests_oauthlib import OAuth2Session
import os

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

API_ENDPOINT = 'https://discordapp.com/api/v6'
CLIENT_ID = '393872294004391936'
CLIENT_SECRET = 'a3d9gVHQPdXo-n73rVskNAPJCjNh8w0p'
REDIRECT_URI = 'http://localhost:8000/account/callback'
TOKEN_URL = 'https://discordapp.com/api/oauth2/token'
API_BASE_URL = 'https://discordapp.com/api'
AUTHORIZATION_BASE_URL = 'https://discordapp.com/api/oauth2/authorize'


def token_updater(token):
    os.environ['oauth2_token'] = token

def make_session(token=None, state=None, scope=None):
    return OAuth2Session(
        client_id=CLIENT_ID,
        token=token,
        state=state,
        scope=scope,
        redirect_uri=REDIRECT_URI,
        auto_refresh_kwargs={
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        },
        auto_refresh_url=TOKEN_URL,
        token_updater=token_updater)

# views
def index(request):
    return HttpResponse("Hello, world. Welcome to account index.")
def login(request):
    scope = ['identify email connections guilds guilds.join']
    discord = make_session(scope=scope)
    authorization_url, state = discord.authorization_url(AUTHORIZATION_BASE_URL)
    os.environ['oauth2_state'] = state
    return redirect(authorization_url)
def callback(request):
    #TODO: store info in sql, username, token, id
    discord = make_session(state=os.environ['oauth2_state'])
    token = discord.fetch_token(
        TOKEN_URL,
        client_secret=CLIENT_SECRET,
        code=(request.GET.get('code')))
    print(token)
    return HttpResponse("congrats, you did it! now, if you are me, do the TODO stuff")
