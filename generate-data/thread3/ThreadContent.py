import csv
import numpy as np
data = []
with open('output.tsv',encoding='utf-8') as tsvfile:
    reader = csv.reader(tsvfile, delimiter='\t')
    for row in reader:
        data.append(row)

#data = np.array(data)
filee = open("threadContent.json", "w")
filee.write("var threadContentData = [\n")

print(data)
for row in data:
    filee.write("{ \"topic\":\""+row[2]+"\",\n")
    filee.write("\t\t\"thread_id\":\""+row[3]+"\",\n")
    filee.write("\t\t\"post_id\":"+row[5]+",\n")
    filee.write("\t\t\"time\":\""+row[4]+"\",\n")
    filee.write("\t\t\"content\":\""+row[1]+"\",\n")
    filee.write("\t\t\"user_id\":\""+row[0]+"\",\n")
    filee.write("\t\t\"replyBy\": ["+row[7]+"],\n")
    filee.write("\t\t\"replyTo\": ["+row[6]+"]},\n")
filee.write("],")
filee.write("\"id\":\"5\"}]")
filee.close()
