class WeatherApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadDefaultLocation();
    }

    initializeElements() {
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.weatherContent = document.getElementById('weatherContent');
        this.errorMessage = document.getElementById('errorMessage');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchWeather());
        this.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        
        // Add input focus effects
        this.cityInput.addEventListener('focus', () => {
            this.cityInput.style.transform = 'scale(1.02)';
        });
        
        this.cityInput.addEventListener('blur', () => {
            this.cityInput.style.transform = 'scale(1)';
        });
    }

    showLoading() {
        this.hideAll();
        this.loading.classList.remove('hidden');
    }

    showError(message) {
        this.hideAll();
        this.errorMessage.textContent = message;
        this.error.classList.remove('hidden');
    }

    showWeather() {
        this.hideAll();
        this.weatherContent.classList.remove('hidden');
    }

    hideAll() {
        this.loading.classList.add('hidden');
        this.error.classList.add('hidden');
        this.weatherContent.classList.add('hidden');
    }

    async searchWeather() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        this.showLoading();
        
        try {
            const response = await fetch(`/weather/${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch weather data');
            }
            
            this.displayWeather(data);
            this.showWeather();
        } catch (error) {
            this.showError(error.message);
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`/weather/coords/${latitude}/${longitude}`);
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to fetch weather data');
                    }
                    
                    this.displayWeather(data);
                    this.showWeather();
                    this.cityInput.value = data.current.city;
                } catch (error) {
                    this.showError(error.message);
                }
            },
            (error) => {
                let message = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                this.showError(message);
            }
        );
    }

    displayWeather(data) {
        const { current, hourly, daily } = data;
        
        // Current weather
        document.getElementById('cityName').textContent = `${current.city}, ${current.country}`;
        document.getElementById('dateTime').textContent = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('currentTemp').textContent = `${current.temperature}°C`;
        document.getElementById('weatherDesc').textContent = current.weather.description;
        document.getElementById('feelsLike').textContent = current.feels_like;
        document.getElementById('sunrise').textContent = current.sunrise;
        document.getElementById('sunset').textContent = current.sunset;
        
        // Weather icon with animation
        const iconElement = document.getElementById('weatherIcon');
        iconElement.className = this.getWeatherIcon(current.weather.main);
        
        // Weather details
        document.getElementById('humidity').textContent = `${current.humidity}%`;
        document.getElementById('windSpeed').textContent = `${current.wind_speed} m/s`;
        document.getElementById('pressure').textContent = `${current.pressure} hPa`;
        document.getElementById('visibility').textContent = `${current.visibility} km`;
        
        // Hourly forecast
        this.displayHourlyForecast(hourly);
        
        // Daily forecast
        this.displayDailyForecast(daily);
    }

    displayHourlyForecast(hourly) {
        const container = document.getElementById('hourlyForecast');
        container.innerHTML = '';
        
        hourly.forEach((hour, index) => {
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-item';
            hourElement.style.animationDelay = `${index * 0.1}s`;
            
            hourElement.innerHTML = `
                <div class="time">${hour.time}</div>
                <i class="${this.getWeatherIcon(hour.weather.main)}"></i>
                <div class="temp">${hour.temperature}°</div>
            `;
            
            container.appendChild(hourElement);
        });
    }

    displayDailyForecast(daily) {
        const container = document.getElementById('dailyForecast');
        container.innerHTML = '';
        
        daily.forEach((day, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-item';
            dayElement.style.animationDelay = `${index * 0.1}s`;
            
            dayElement.innerHTML = `
                <div class="daily-info">
                    <i class="${this.getWeatherIcon(day.weather.main)}"></i>
                    <div>
                        <div class="day">${day.day}</div>
                        <div class="desc">${day.weather.description}</div>
                    </div>
                </div>
                <div class="daily-temp">
                    <span class="temp-max">${Math.round(day.temp_max)}°</span>
                    <span class="temp-min">${Math.round(day.temp_min)}°</span>
                </div>
            `;
            
            container.appendChild(dayElement);
        });
    }

    getWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-drizzle',
            'Thunderstorm': 'fas fa-thunderstorm',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-tornado'
        };
        
        return iconMap[weatherMain] || 'fas fa-sun';
    }

    loadDefaultLocation() {
        // Load a default city on startup
        this.cityInput.value = 'Delhi';
        setTimeout(() => {
            this.searchWeather();
        }, 1000);
    }
}

// Initialize the app with enhanced effects
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
    
    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
