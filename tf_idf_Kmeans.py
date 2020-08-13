from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF, LatentDirichletAllocation
from nltk.corpus import stopwords
import csv 

from sklearn.cluster import KMeans
from sklearn.metrics import precision_recall_fscore_support as score

import pandas as pd
import random
import numpy as np

n_samples = 1584
n_features = 1000
n_components = 5
n_top_words = 8

def print_top_words(model, feature_names, n_top_words):
    for topic_idx, topic in enumerate(model.components_):
        message = "Topico #%d: " % topic_idx
        message += " ".join([feature_names[i] 
                             for i in topic.argsort()[:-n_top_words - 1:-1]])
        print(message)
    print()


data = []
#with open('thread5.tsv',encoding='utf-8') as tsvfile:
#    reader = csv.reader(tsvfile, delimiter='\t')
#    for row in reader:
#        data.append(row)
df = pd.read_csv('output.tsv',sep=',')

for id,row in df.iterrows():
    data.append([row['user-id'],row['text'],row['topic'],row['thread-id'],row['time'],row['post-id'],row['replyTo'],row['replyBy']])

#print(data)
data = np.array(data)
corpus = data[:,1] #5 1

#random.shuffle(corpus)

word = stopwords.words('english')

tfidf_vectorizer = TfidfVectorizer(max_df=0.95, min_df=2,
                                   max_features=n_features,
                                   stop_words=word) #'english')
tfidf = tfidf_vectorizer.fit_transform(corpus)
#print(tfidf)
#print(tfidf_vectorizer.idf_)
"""
nmf = NMF(n_components=n_components, random_state=1,
            alpha=.1, l1_ratio=.5).fit(tfidf)
"""

names = tfidf_vectorizer.get_feature_names()
#print_top_words(nmf, names, n_top_words)

cluster=11

km =KMeans(n_clusters=cluster,random_state=0,init='k-means++', 
        max_iter=100, n_init=1,verbose=True,algorithm='elkan')
km.fit(tfidf)
#print(km.labels_)

##### Crear data de cluster
filee = open("data/cluster.json", "w")
filee.write("var clusterResult=[\n")

results = pd.DataFrame()

results['document_text'] = corpus
results['thread_id'] = data[:,3] #1 3
results['post_id'] = data[:,5] #2 5
results['cluster_id'] = km.labels_
#print("\n Resultado de grupos:\n", results)

order_centroids = km.cluster_centers_.argsort()[:, ::-1]
for i in range(cluster):
        filee.write("\t\t{\n")
        filee.write("\t\t\t\"-id\":\""+str(i)+"\",\n")
        filee.write("\t\t\t\"-size\":\""+str(i)+"\",\n")
        filee.write("\t\t\t\"title\": {\n")
        filee.write("\t\t\t \"phrase\": [\n")
        #print("Cluster %d:" % i, end='')
        for ind in order_centroids[i, :n_top_words]:
            #print(' %s' % names[ind], end='')
            filee.write("\t\t\t\t\""+names[ind]+"\",\n")
        #print()
        filee.write("\t\t\t ] \n")
        filee.write("\t\t\t},\n")
        filee.write("\t\t\t\"document\": [ \n")
        df = results.loc[results['cluster_id']==i]
        for index, row in df.iterrows():
            filee.write("\t\t\t { \"-refid\": \""+row['thread_id']+"_"+row['post_id']+"\" }, \n")
        filee.write("\t\t\t] \n")
        filee.write("\t\t}, \n")

filee.write("]")
filee.close()
