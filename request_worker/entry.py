from js import Response, fetch, Headers, JSON

from urllib.parse import urlparse, parse_qs
import os

async def fetch_geocode(key, string):
    url = f"https://eu1.locationiq.com/v1/search.php?key={key}&q={string}&format=json";
    print(url)
    return await fetch(url)

async def fetch_reverse_geocode(key, lat, lon):
    url = f"https://eu1.locationiq.com/v1/reverse.php?key={key}&lat={lat}&lon={lon}&format=json";
    print(url)
    return await fetch(url)

async def fetch_weather(key, lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={key}";
    print(url)
    return await fetch(url)

async def on_fetch(request, env):
    args = parse_qs(urlparse(request.url).query)
    print(args)

    if args['type'][0] == 'geocode':
        return await fetch_geocode(env.LOCATIONIQ_API_KEY, args['string'][0])

    if args['type'][0] == 'reverse_geocode':
        return await fetch_reverse_geocode(env.LOCATIONIQ_API_KEY, args['lat'][0], args['lon'][0])

    if args['type'][0] == 'weather':
        return await fetch_weather(env.OPENWEATHERMAP_API_KEY, args['lat'][0], args['lon'][0])
