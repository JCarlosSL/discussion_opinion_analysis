import json

data = []
data.append({
    'name': 'Scott',
    'website': 'stackabuse.com',
    'from': 'Nebraska'
})
data.append({
    'name': 'Larry',
    'website': 'google.com',
    'from': 'Michigan'
})
data.append({
    'name': 'Tim',
    'website': 'apple.com',
    'from': 'Alabama'
})
print(data)
with open('data.txt', 'a') as outfile:
    json.dump(data, outfile)