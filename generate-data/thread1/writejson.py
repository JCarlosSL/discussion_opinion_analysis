import json

data = {}
data['people'] = []
data['people'].append({
    'name': 'Scott',
    'website': 'stackabuse.com',
    'from': 7
})
data['people'].append({
    'name': 'Larry',
    'website': 'google.com',
    'from': 4
})
data['people'].append({
    'name': 'Tim',
    'website': 'apple.com',
    'from': 3
})

with open('data.txt', 'a') as outfile:
    json.dump(data, outfile)