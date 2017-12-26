from django.db import models
# Create your models here.


class account(models.Model):
    userId = models.CharField(max_length=30) # a unique id
    username = models.CharField(max_length=32) # not unique
    discriminator = models.IntegerField() # 4 digit number
    avatar = models.CharField(max_length=100) # identifier of image
    token = models.CharField(max_length=50) # updates every login
    guilds = models.CharField(max_length=500) # encoded in json
