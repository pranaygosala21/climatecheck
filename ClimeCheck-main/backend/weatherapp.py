from flask import Flask, request, jsonify, send_from_directory
import requests
from urllib.parse import quote_plus

app = Flask(__name__)

TOMORROW_API_KEY = 'ba6h2MiL8l1tRWFQtWnR3ce8bsC3s1Ca'
GOOGLE_MAPS_API_KEY = 'AIzaSyCI6KxsjrjvKqKpqCSlwrdgzzqbigRJ-jk'
IPINFO_API_KEY = '28f772be3811cd'

@app.route('/')
def index():
    return send_from_directory('static', 'weatherinfo.html')

@app.route('/get_weather', methods=['GET'])
def get_weather():
    street = request.args.get('street')
    city = request.args.get('city')
    state = request.args.get('state')

    address = f"{street}, {city}, {state}"
    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={quote_plus(address)}&key={GOOGLE_MAPS_API_KEY}"
    geocode_response = requests.get(geocode_url).json()

    if geocode_response['status'] == 'OK':
        location = geocode_response['results'][0]['geometry']['location']
        lat, lon = location['lat'], location['lng']

        weather_url = f"https://api.tomorrow.io/v4/timelines?location={lat},{lon}&fields=temperature,humidity,windSpeed,visibility,cloudCover,weatherCode,uvIndex,temperatureMax,temperatureMin,sunriseTime,sunsetTime,pressureSeaLevel&timesteps=1h,1d&units=imperial&timezone=America/Los_Angeles&apikey={TOMORROW_API_KEY}"
        weather_response = requests.get(weather_url).json()

        if 'data' in weather_response and 'timelines' in weather_response['data']:
            current_weather = weather_response['data']['timelines'][0]['intervals'][0]['values']

            forecast_data = []
            for i in range(6):
                try:
                    forecast = weather_response['data']['timelines'][0]['intervals'][i]
                    forecast_data.append({
                        'date': forecast['startTime'],
                        'weatherCode': forecast['values']['weatherCode'],
                        'temperatureMax': forecast['values']['temperatureMax'],
                        'temperatureMin': forecast['values']['temperatureMin'],
                        'windSpeed': forecast['values']['windSpeed'],
                        'precipitation': forecast['values'].get('precipitation', 'N/A'),
                        'chanceOfRain': forecast['values'].get('precipitationProbability', 0),
                        'humidity': forecast['values']['humidity'],
                        'visibility': forecast['values'].get('visibility', 0),
                        'sunrise': forecast['values'].get('sunriseTime', 'N/A'),
                        'sunset': forecast['values'].get('sunsetTime', 'N/A'),
                        'pressureSeaLevel': forecast['values'].get('pressureSeaLevel', 'N/A')
                    })
                except IndexError:
                    break

            return jsonify({
                'location': f"{street}, {city}, {state}",
                'temperature': current_weather['temperature'],
                'weatherCode': current_weather['weatherCode'],
                'humidity': current_weather['humidity'],
                'windSpeed': current_weather['windSpeed'],
                'visibility': current_weather['visibility'],
                'cloudCover': current_weather['cloudCover'],
                'uvIndex': current_weather['uvIndex'],
                'pressureSeaLevel': current_weather.get('pressureSeaLevel', 'N/A'),
                'forecast': forecast_data
            })
        else:
            return jsonify({'error': 'Unable to retrieve weather data.'})
    else:
        return jsonify({'error': 'Unable to retrieve geolocation data.'})

@app.route('/get_weather_auto', methods=['POST'])
def get_weather_auto():
    ipinfo_data = request.json

    if 'loc' in ipinfo_data and 'city' in ipinfo_data and 'region' in ipinfo_data:
        lat, lon = ipinfo_data['loc'].split(',')
        city = ipinfo_data['city']
        state = ipinfo_data['region']

        weather_url = f"https://api.tomorrow.io/v4/timelines?location={lat},{lon}&fields=temperature,humidity,windSpeed,visibility,cloudCover,weatherCode,uvIndex,temperatureMax,temperatureMin,sunriseTime,sunsetTime,pressu   reSeaLevel&timesteps=1h,1d&units=imperial&timezone=America/Los_Angeles&apikey={TOMORROW_API_KEY}"
        weather_response = requests.get(weather_url).json()

        if 'data' in weather_response and 'timelines' in weather_response['data']:
            current_weather = weather_response['data']['timelines'][0]['intervals'][0]['values']

            forecast_data = []
            for i in range(6):
                try:
                    forecast = weather_response['data']['timelines'][0]['intervals'][i]
                    forecast_data.append({
                        'date': forecast['startTime'],
                        'weatherCode': forecast['values']['weatherCode'],
                        'temperatureMax': forecast['values']['temperatureMax'],
                        'temperatureMin': forecast['values']['temperatureMin'],
                        'windSpeed': forecast['values']['windSpeed'],
                        'precipitation': forecast['values'].get('precipitation', 'N/A'),
                        'chanceOfRain': forecast['values'].get('precipitationProbability', 0),
                        'humidity': forecast['values']['humidity'],
                        'visibility': forecast['values'].get('visibility', 0),
                        'sunrise': forecast['values'].get('sunriseTime', 'N/A'),
                        'sunset': forecast['values'].get('sunsetTime', 'N/A'),
                        'pressureSeaLevel': forecast['values'].get('pressureSeaLevel', 'N/A')
                    })
                except IndexError:
                    break

            return jsonify({
                'location': f"{city}, {state}",
                'temperature': current_weather['temperature'],
                'weatherCode': current_weather['weatherCode'],
                'humidity': current_weather['humidity'],
                'windSpeed': current_weather['windSpeed'],
                'visibility': current_weather['visibility'],
                'cloudCover': current_weather['cloudCover'],
                'uvIndex': current_weather['uvIndex'],
                'pressureSeaLevel': current_weather.get('pressureSeaLevel', 'N/A'),
                'forecast': forecast_data
            })
        else:
            return jsonify({'error': 'Unable to retrieve weather data.'})
    else:
        return jsonify({'error': 'Unable to auto-detect location.'})
    
@app.route('/get_weather_hourly', methods=['GET'])
def get_weather_hourly():
    street = request.args.get('street')
    city = request.args.get('city')
    state = request.args.get('state')

    # Geocoding to get latitude and longitude from address
    address = f"{street}, {city}, {state}"
    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={quote_plus(address)}&key={GOOGLE_MAPS_API_KEY}"
    geocode_response = requests.get(geocode_url).json()

    if geocode_response['status'] == 'OK':
        location = geocode_response['results'][0]['geometry']['location']
        lat, lon = location['lat'], location['lng']

        # Fetching hourly weather data for the next 120 hours (5 days)
        weather_url = f"https://api.tomorrow.io/v4/timelines?location={lat},{lon}&fields=windDirection,temperature,humidity,windSpeed,pressureSeaLevel&timesteps=1h&units=imperial&timezone=America/Los_Angeles&apikey={TOMORROW_API_KEY}"
        weather_response = requests.get(weather_url).json()
        print(f"WEATHER HOURLY: {weather_response}")
        
        if 'data' in weather_response and 'timelines' in weather_response['data']:
            hourly_forecast = weather_response['data']['timelines'][0]['intervals']

            hourly_data = []
            for forecast in hourly_forecast:
                hourly_data.append({
                    'time': forecast['startTime'],
                    'temperature': forecast['values']['temperature'],
                    'windDirection': forecast['values']['windDirection'],
                    'humidity': forecast['values']['humidity'],
                    'windSpeed': forecast['values']['windSpeed'],
                    'pressureSeaLevel': forecast['values'].get('pressureSeaLevel', 'N/A')
                })

            return jsonify({
                'location': f"{street}, {city}, {state}",
                'hourly_forecast': hourly_data
            })
        else:
            return jsonify({'error': 'Unable to retrieve weather data.'})
    else:
        return jsonify({'error': 'Unable to retrieve geolocation data.'})

@app.route('/get_weather_hourly_auto', methods=['POST'])
def get_weather_hourly_auto():
    ipinfo_data = request.json

    if 'loc' in ipinfo_data and 'city' in ipinfo_data and 'region' in ipinfo_data:
        lat, lon = ipinfo_data['loc'].split(',')
        city = ipinfo_data['city']
        state = ipinfo_data['region']

        weather_url = f"https://api.tomorrow.io/v4/timelines?location={lat},{lon}&fields=windDirection,temperature,humidity,windSpeed,pressureSeaLevel&timesteps=1h&units=imperial&timezone=America/Los_Angeles&apikey={TOMORROW_API_KEY}"
        weather_response = requests.get(weather_url).json()
        
        if 'data' in weather_response and 'timelines' in weather_response['data']:
            hourly_forecast = weather_response['data']['timelines'][0]['intervals']

            hourly_data = []
            for forecast in hourly_forecast:
                hourly_data.append({
                    'time': forecast['startTime'],
                    'temperature': forecast['values']['temperature'],
                    'windDirection': forecast['values']['windDirection'],
                    'humidity': forecast['values']['humidity'],
                    'windSpeed': forecast['values']['windSpeed'],
                    'pressureSeaLevel': forecast['values'].get('pressureSeaLevel', 'N/A')
                })

            return jsonify({
                'location': f"{city}, {state}",
                'hourly_forecast': hourly_data
            })
        else:
            return jsonify({'error': 'Unable to retrieve weather data.'})
    else:
        return jsonify({'error': 'Unable to retrieve geolocation data.'})

if __name__ == '__main__':
    app.run(debug=True)
