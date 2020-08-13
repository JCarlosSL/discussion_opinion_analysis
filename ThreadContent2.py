import csv
import numpy as np
from datetime import datetime
import pandas as pd
def toTimestamp(date):
    datetime_object=datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
    timestamp = datetime.timestamp(datetime_object)
    return str(timestamp)

data = []
"""
with open('thread5.tsv',encoding='utf-8') as tsvfile:
    reader = csv.reader(tsvfile, delimiter='\t')
    for row in reader:
        data.append(row)
"""
df = pd.read_csv('data.tsv',sep='\t')


data = np.array(data)
filee = open("threadContent.json", "w")
filee.write("var threadContentData = [\n")
    
filee.write("{\"post\":[\n")
for id,row in df.iterrows():
    filee.write("{ \"topic\":\""+row['Topic']+"\",\n")
    filee.write("\t\t\"thread_id\":\""+str(row['Thread ID'])+"\",\n")
    filee.write("\t\t\"post_id\":"+str(row['Post ID'])+",\n")
    filee.write("\t\t\"time\":"+row['Time']+",\n")
    filee.write("\t\t\"content\":\""+row['Post Content']+"\",\n")
    filee.write("\t\t\"user_id\":\""+row['User ID']+"\",\n")
    #filee.write("\t\t\"replyBy\": ["+str(row['replyTo'])+"],\n")
    #filee.write("\t\t\"replyTo\": ["+str(row['replyBy'])+"]},\n")
filee.write("],")
filee.write("\"id\":\"5\"}]")
filee.close()
