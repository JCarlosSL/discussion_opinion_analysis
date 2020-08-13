# Using readlines() 
file1 = open('MariaCespedesc1290657735005081600.tsv', 'r') 
Lines = file1.readlines() 
# line=Lines[2]
# print(line.split('\t'))
count = 0
# Strips the newline character 
for line in Lines: 
    print("Line{}: {}".format(count,line.split("\t")[1])) 

