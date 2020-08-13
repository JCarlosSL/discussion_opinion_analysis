import csv
import numpy as np
from datetime import datetime

def toTimestamp(date):
    datetime_object=datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
    timestamp = datetime.timestamp(datetime_object)
    return str(timestamp)

data = []
with open('thread5.tsv',encoding='utf-8') as tsvfile:
    reader = csv.reader(tsvfile, delimiter='\t')
    for row in reader:
        data.append(row)

data = np.array(data)
filee = open("threadContent.json", "w")
filee.write("var threadContentData = [\n")
    
filee.write("{\"post\":[\n")
for row in data:
    filee.write("{ \"topic\":\""+row[0]+"\",\n")
    filee.write("\t\t\"thread_id\":\""+row[1]+"\",\n")
    filee.write("\t\t\"post_id\":"+row[2]+",\n")
    filee.write("\t\t\"time\":"+toTimestamp(row[4])+",\n")
    filee.write("\t\t\"content\":\""+row[5]+"\",\n")
    filee.write("\t\t\"user_id\":\""+row[3]+"\",\n")
    filee.write("\t\t\"replyBy\": ["+row[6]+"],\n")
    filee.write("\t\t\"replyTo\": ["+row[7]+"]},\n")
filee.write("],")
filee.write("\"id\":\"5\"}]")
filee.close()
