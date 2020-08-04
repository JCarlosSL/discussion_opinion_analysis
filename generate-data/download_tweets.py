import csv
import tweepy
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

# Oauth keys
consumer_key = "JafJoAMSCwUZoliYTZyVaIBfQ"
consumer_secret = "0oORIdmX9TgXqcVM0Whl7KhbfJKiDWMhCxtHIcrcZLwoGdppYd"
access_token = "975491031478296577-K88CwhvceLRF6loLdgKup1j2vfv7TKc"
access_token_secret = "JrGJVYBXBkRptlrjskBIHRoWhhpSKC3bRZYsa7RklBuzJ"

# Authentication with Twitter
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
api = tweepy.API(auth, wait_on_rate_limit=True)

# update these for the tweet you want to process replies to 'name' = the account username and you can find the tweet id within the tweet URL
t_name = 'leoquirozc'
t_tweet_id = '1290046347295387648'
original_tweet = api.statuses_lookup([t_tweet_id]) # id_list is the list of tweet ids
print(original_tweet[0].user.screen_name)
# tweet=tweepy.Cursor(api.search,q='to'+name).items(1000)
# if hasattr(tweet, 'in_reply_to_status_id_str'):
#   print(original_tweet[0].text)
replies=[]
for tweet in tweepy.Cursor(api.search,q='to:'+t_name, tweet_mode='extended').items(1000):
  if hasattr(tweet, 'in_reply_to_status_id_str'):
    #print(tweet.in_reply_to_status_id_str,tweet_id)
    if (tweet.in_reply_to_status_id_str==t_tweet_id):
      replies.append(tweet)
with open(t_name+t_tweet_id+'.tsv', 'w') as f:
    csv_writer = csv.DictWriter(f, fieldnames=('user-id', 'text','topic','thread-id','time','post-id','reply-to','reply-by'))
    csv_writer.writeheader()
    n=1
    row = {'topic':'covid-19','thread-id':n,'post-id':original_tweet[0].id,'user-id': t_name,'time':original_tweet[0].created_at,'text': original_tweet[0].text,'reply-to':'','reply-by':original_tweet[0].user.screen_name}
    csv_writer.writerow(row)    
    for tweet in replies:
        n+=1
        row = {'topic':'covid-19','thread-id':n,'post-id':tweet.id,'user-id': tweet.user.screen_name,'time':tweet.created_at,'text': tweet.full_text,'reply-to':original_tweet[0].user.screen_name,'reply-by':tweet.user.screen_name}
        csv_writer.writerow(row)
        