# import modules
import os
import json
import requests
import MySQLdb
from django.shortcuts import render, redirect
from django.http import HttpResponse
from requests_oauthlib import OAuth2Session

# import keys
keys = json.loads(open('keys.json').read())

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
API_ENDPOINT = 'https://discordapp.com/api/v6'
CLIENT_ID = keys['discordid']
CLIENT_SECRET = keys['discordsecret']
REDIRECT_URI = 'http://localhost:8000/account/callback'
TOKEN_URL = 'https://discordapp.com/api/oauth2/token'
API_BASE_URL = 'https://discordapp.com/api'
AUTHORIZATION_BASE_URL = 'https://discordapp.com/api/oauth2/authorize'
mysql = MySQLdb.connect(host=keys['mysqlip'], user='root', passwd=keys['mysqlpasswd'], port=3306, db='testv1')
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
    return render(request, 'account_index.html', {'userId' : request.session['userId'], 'avatar' : request.session['avatar']})
    # return HttpResponse("Hello, world. Welcome to account index.")

def login(request):
    scope = ['identify guilds']
    discord = make_session(scope=scope)
    authorization_url, state = discord.authorization_url(AUTHORIZATION_BASE_URL)
    os.environ['oauth2_state'] = state
    return redirect(authorization_url)

def callback(request):
    # pull data
    discord = make_session(state=os.environ['oauth2_state'])
    token = discord.fetch_token(
        TOKEN_URL,
        client_secret=CLIENT_SECRET,
        code=(request.GET.get('code')))
    r = requests.get('http://discordapp.com/api/users/@me', headers={"Authorization": "Bearer %s" % token['access_token']})
    userInfo = r.json()

    # find shared guilds
    r = requests.get('http://discordapp.com/api/users/@me/guilds', headers={"Authorization": "Bearer %s" % token['access_token']})
    userGuilds = r.json()
    sharedGuilds = []
    for i in userGuilds:
        s = ("SELECT * FROM account_guilds WHERE guildId=%s")
        mysqlcon.execute(s , i['id'])
        r = mysqlcon.fetchone()
        if r is not None:
            sharedGuilds.append(r)

    # update data
    mysqlcon.execute("""SELECT * FROM account_account WHERE userId='%s'""" % userInfo['id'])
    r = mysqlcon.fetchone()
    if r is not None: # if user has already registered, update the data
        s = ("UPDATE account_account SET username = %s, discriminator = %s, avatar = %s, token = %s, guilds = %r WHERE userId=%s")
        mysqlcon.execute(s, (userInfo['username'], userInfo['discriminator'], userInfo['avatar'], token['access_token'], sharedGuilds, userInfo['id']))
    else: # if user has not, add the data
        s = ("INSERT INTO account_account (userId, username, discriminator, avatar, token, guilds) VALUES (%s, %s, %s, %s, %s, %s)")
        mysqlcon.execute(s, (userInfo['id'], userInfo['username'], userInfo['discriminator'], userInfo['avatar'], token['access_token'], sharedGuilds))

    # store data
    request.session['userId'] = userInfo['id']  # set 'id' in the session
    request.session['access_token'] = token['access_token']
    request.session['avatar'] = userInfo['avatar']
    request.session['guilds'] = sharedGuilds
    mysql.commit()
    return redirect('http://localhost:8000/account/')