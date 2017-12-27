from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpRequest
from requests_oauthlib import OAuth2Session
import os
import requests
import MySQLdb


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
API_ENDPOINT = 'https://discordapp.com/api/v6'
CLIENT_ID = '393872294004391936'
CLIENT_SECRET = 'a3d9gVHQPdXo-n73rVskNAPJCjNh8w0p'
REDIRECT_URI = 'http://localhost:8000/account/callback'
TOKEN_URL = 'https://discordapp.com/api/oauth2/token'
API_BASE_URL = 'https://discordapp.com/api'
AUTHORIZATION_BASE_URL = 'https://discordapp.com/api/oauth2/authorize'
mysql = MySQLdb.connect(host='35.196.94.58', user='root',
                           passwd='uEgwrOugbAG0Nbb1', port=3306, db='testv1')
mysqlcon = mysql.cursor()
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
    discord = make_session(state=os.environ['oauth2_state'])
    token = discord.fetch_token(
        TOKEN_URL,
        client_secret=CLIENT_SECRET,
        code=(request.GET.get('code')))
    r = requests.get('http://discordapp.com/api/users/@me',
                     headers={"Authorization": "Bearer %s" % token['access_token']})
    userInfo = r.json()
    mysql.query("""SELECT * FROM account_account WHERE userId='%s'""" % userInfo['id'])
    r2 = mysql.store_result()
    r2dict = r2.fetch_row(how=1)
    print(r2dict)
    if not r2dict: # if user has already registered
        print('dontoook')
        mysql.query("""UPDATE account_account SET username = '%s', discriminator = '%s', avatar = '%s', token = '%s', guilds = '%s' WHERE userId='%s'""" % (
            userInfo['username'], userInfo['discriminator'], userInfo['avatar'], token['access_token'], 'maybeitsunull', userInfo['id']))
        mysql.commit()
    else:
        print('lookatme')
        mysql.query("""INSERT INTO account_account (userId, username, discriminator, avatar, token, guilds) VALUES ('%s', '%s', '%s', '%s', '%s', '%s')""" % (userInfo['id'], userInfo['username'], userInfo['discriminator'], userInfo['avatar'], token['access_token'], 'nullfornow'))
        mysql.commit()
    return HttpResponse("congrats, you did it! now, if you are me, do the TODO stuff") 
