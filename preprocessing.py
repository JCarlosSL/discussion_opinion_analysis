#IBM Watson libs
from ibm_watson import ToneAnalyzerV3
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson import ApiException

#Translate lib
from translate import Translator

#load files
import json
import csv

#load in dataframes
import pandas as pd

#To order dictionaries lib
from collections import OrderedDict

#Twiteer API and util libs
import tweepy
import ssl
from datetime import datetime

def toTimestamp(date):
  datetime_object=datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
  timestamp = datetime.timestamp(datetime_object)

############################################################################

class WatsonSentiments:
  '''Class analyzer for sentiment classification'''
  
  def __init__(self,filename):
    
    #load credentials to extract key
    with open(filename) as f: 
      credentials = json.load(f)

    #set IBM IAM token
    ##autenthicate api server
    authenticator = IAMAuthenticator(credentials['apikey']) 
    self.tone_analyzer = ToneAnalyzerV3(
      version='2017-09-21',
      authenticator=authenticator
    ) ##get tone analyzer

    self.tone_analyzer.set_service_url(
      'https://api.us-south.tone-analyzer.watson.cloud.ibm.com'
    ) #endpoint Dallas
    self.tone_analyzer.set_disable_ssl_verification(True)

  def text2sentiment(self,text):
    '''Convert single text into json emotions'''

    try: #here goes the analysis of text
      tone_analysis = tone_analyzer.tone(
        {'text': text},
        content_type='application/json'
      ).get_result()
    except ApiException as ex:
      print("Method failed with status code " + str(ex.code) + ": " + ex.message)

    return tone_analysis #return json of results
  
  def best_confidence(self,tone_json):
    '''Return the emotion with best confidence'''
    
    tones = json.loads(json.dumps(tone_analysis['document_tone']['tones']))
    tones.sort(key=lambda x:x['score'], reverse=True)
    best_tone = tones[0] if len(tones)>0 else {'score':0,'tone_id':'neutral'}

    return best_tone

  def classify_sentiments(self,data,fileout='annotation.json'):
    '''Read english opinions csv format to json anotations format'''

    #data = pd.read_csv(filein)
    annotationData = []

    for idx,row in df.iterrows():   
      
      text = row['text']   
      tone_json = text2sentiment(text)
      sentiment = self.best_confidence(tone_json)

      d = {}
      d['_unit_id'] = idx
      d['opinion_toward_the_above_topic'] = sentiment['tone_id']
      d['opinion_toward_the_above_topic:confidence'] = sentiment['score']
      d['post_id'] = row['post-id']
      d['thread_id'] = row['thread-id']
      d['time'] = str(toTimestamp(row['time']))
      d['topic'] = row['topic']
      d['user_id'] = row['user-id']
      annotationData.append(d)

    with open(fileout, 'w') as f:
      json.dump(annotationData, f)
   
#############################################################################

class Translate:

  def __init__(self):

    self.translator = Translator(
      provider='mymemory', from_lang='es' ,to_lang='en'
    )

  def set_languages(lang1,lang2):

    self.translator = Translator(
      provider='mymemory', from_lang=lang1 ,to_lang=lang2
    )

  def esp2en(self,text):
    
    return self.translator.translate(element)

  def translate_csv(self,filein)

    data = pd.read_csv(self.dataName,sep='\t')
    
    translations = {}
    text_cols = data['text'].unique()
    
    for idx,text in data.iterrows():
        translations[text] =  translator.translate(text)
    
    #translations
    data.replace(translations, inplace = True)
    #data.to_csv(fileout,index = False, header=True)

    return data

#############################################################

class Preprocessing:
  '''Generate annotations.json'''

  def __init__(self,credentials='credentials.json'):

    self.translate = Translate
    self.watson = WatsonSentiments(credentials)

  def getThreadContent(self,filein,fileout='annotations.json'):

    translate_file = output
    data = self.translate.translate_csv(filein)
    self.watson.classify_sentiments(data)


