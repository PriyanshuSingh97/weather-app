from flask import Flask, render_template, request, jsonify
import requests
import os
from datetime import datetime, timedelta
import json

app = Flask(__name__)

# OpenWeatherMap API key
API_KEY = 'e83f82cbf0461de3f05e40ccc0335bb2'
BASE_URL = "http://api.openweathermap.org/data/2.5"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/weather/<city>')
def get_weather(city):
    try:
        # Current weather
        current_url = f"{BASE_URL}/weather?q={city}&appid={API_KEY}&units=metric"
        current_response = requests.get(current_url, timeout=10)
        current_data = current_response.json()
        
        if current_response.status_code != 200:
            return jsonify({'error': 'City not found'}), 404
        
        # Forecast data
        forecast_url = f"{BASE_URL}/forecast?q={city}&appid={API_KEY}&units=metric"
        forecast_response = requests.get(forecast_url, timeout=10)
        forecast_data = forecast_response.json()
        
        # Process forecast data for hourly and daily
        hourly_forecast = forecast_data['list'][:8]  # Next 24 hours
        daily_forecast = []
        
        # Group forecast by days
        current_date = None
        daily_temp_min = float('inf')
        daily_temp_max = float('-inf')
        daily_data = None
        
        for item in forecast_data['list']:
            date = datetime.fromtimestamp(item['dt']).date()
            if current_date != date:
                if daily_data:
                    daily_data['temp_min'] = daily_temp_min
                    daily_data['temp_max'] = daily_temp_max
                    daily_forecast.append(daily_data)
                
                current_date = date
                daily_temp_min = item['main']['temp_min']
                daily_temp_max = item['main']['temp_max']
                daily_data = {
                    'date': date.strftime('%Y-%m-%d'),
                    'day': date.strftime('%A'),
                    'weather': item['weather'][0],
                    'temp_min': item['main']['temp_min'],
                    'temp_max': item['main']['temp_max']
                }
            else:
                daily_temp_min = min(daily_temp_min, item['main']['temp_min'])
                daily_temp_max = max(daily_temp_max, item['main']['temp_max'])
        
        weather_data = {
            'current': {
                'city': current_data['name'],
                'country': current_data['sys']['country'],
                'temperature': round(current_data['main']['temp']),
                'feels_like': round(current_data['main']['feels_like']),
                'humidity': current_data['main']['humidity'],
                'pressure': current_data['main']['pressure'],
                'wind_speed': current_data['wind']['speed'],
                'wind_direction': current_data['wind'].get('deg', 0),
                'visibility': current_data.get('visibility', 0) / 1000,
                'weather': current_data['weather'][0],
                'sunrise': datetime.fromtimestamp(current_data['sys']['sunrise']).strftime('%H:%M'),
                'sunset': datetime.fromtimestamp(current_data['sys']['sunset']).strftime('%H:%M'),
                'datetime': datetime.now().strftime('%Y-%m-%d %H:%M')
            },
            'hourly': [
                {
                    'time': datetime.fromtimestamp(item['dt']).strftime('%H:%M'),
                    'temperature': round(item['main']['temp']),
                    'weather': item['weather'][0]
                }
                for item in hourly_forecast
            ],
            'daily': daily_forecast[:5]  # 5-day forecast
        }
        
        return jsonify(weather_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/weather/coords/<lat>/<lon>')
def get_weather_by_coords(lat, lon):
    try:
        current_url = f"{BASE_URL}/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        current_response = requests.get(current_url, timeout=10)
        current_data = current_response.json()
        
        if current_response.status_code != 200:
            return jsonify({'error': 'Location not found'}), 404
        
        return get_weather(current_data['name'])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#  FOR RENDER DEPLOYMENT
if __name__ == '__main__':
    # Get port from environment variable 
    port = int(os.environ.get('PORT', 5000))
    # Disable debug mode in production
    app.run(host='0.0.0.0', port=port, debug=False)
