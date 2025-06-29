import os
import requests
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from geopy.geocoders import Nominatim
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WeatherService:
    """Service for integrating with OpenWeatherMap API"""
    
    def __init__(self):
        """Initialize Weather service with API key"""
        self.api_key = os.getenv("OPENWEATHER_API_KEY")
        if not self.api_key:
            print("Warning: OPENWEATHER_API_KEY not found. Weather features will be disabled.")
        
        self.base_url = "https://api.openweathermap.org/data/3.0/onecall/timemachine"
        self.geocoder = Nominatim(user_agent="supplier_compliance_monitor")
        
        # Define adverse weather conditions
        self.adverse_conditions = {
            'thunderstorm': ['thunderstorm', 'storm'],
            'heavy_rain': ['heavy rain', 'extreme rain', 'heavy intensity rain'],
            'snow': ['snow', 'blizzard', 'heavy snow'],
            'fog': ['fog', 'mist'],
            'extreme_weather': ['tornado', 'hurricane', 'typhoon']
        }
    
    def get_coordinates_from_country(self, country: str) -> Optional[Tuple[float, float]]:
        """
        Get latitude and longitude for a country
        
        Args:
            country: Country name
            
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        try:
            location = self.geocoder.geocode(country)
            if location:
                return (location.latitude, location.longitude)
            return None
        except Exception as e:
            print(f"Error getting coordinates for {country}: {e}")
            return None
    
    def get_historical_weather(self, lat: float, lon: float, date: str) -> Optional[Dict[str, Any]]:
        """
        Fetch historical weather data for a specific date and location
        
        Args:
            lat: Latitude
            lon: Longitude
            date: Date in YYYY-MM-DD format
            
        Returns:
            Weather data dictionary or None if failed
        """
        if not self.api_key:
            return self._mock_weather_data()
        
        try:
            # Convert date to timestamp
            dt = datetime.strptime(date, "%Y-%m-%d")
            timestamp = int(dt.replace(tzinfo=timezone.utc).timestamp())
            
            # Make API request
            params = {
                'lat': lat,
                'lon': lon,
                'dt': timestamp,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(self.base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Weather API error: {response.status_code} - {response.text}")
                return self._mock_weather_data()
                
        except Exception as e:
            print(f"Error fetching weather data: {e}")
            return self._mock_weather_data()
    
    def _mock_weather_data(self) -> Dict[str, Any]:
        """Return mock weather data when API is not available"""
        return {
            "data": [{
                "dt": 1691462400,
                "temp": 25.0,
                "weather": [{
                    "main": "Clear",
                    "description": "clear sky"
                }],
                "wind_speed": 3.5,
                "rain": None,
                "snow": None
            }],
            "mock": True
        }
    
    def analyze_adverse_weather(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze weather data for adverse conditions that could impact delivery
        
        Args:
            weather_data: Weather data from API
            
        Returns:
            Analysis result with adverse conditions found
        """
        if not weather_data or 'data' not in weather_data:
            return {
                "has_adverse_weather": False,
                "conditions": [],
                "severity": "none",
                "justification": "No weather data available"
            }
        
        weather_info = weather_data['data'][0]
        adverse_conditions_found = []
        severity = "none"
        
        # Check weather description
        weather_desc = weather_info.get('weather', [{}])[0].get('description', '').lower()
        weather_main = weather_info.get('weather', [{}])[0].get('main', '').lower()
        
        # Check for adverse conditions
        for condition_type, keywords in self.adverse_conditions.items():
            for keyword in keywords:
                if keyword in weather_desc or keyword in weather_main:
                    adverse_conditions_found.append({
                        "type": condition_type,
                        "description": weather_desc,
                        "main": weather_main
                    })
        
        # Check precipitation
        rain = weather_info.get('rain', {})
        snow = weather_info.get('snow', {})
        
        if rain:
            rain_1h = rain.get('1h', 0) or rain.get('3h', 0)
            if rain_1h > 10:  # Heavy rain threshold (mm/h)
                adverse_conditions_found.append({
                    "type": "heavy_rain",
                    "description": f"Heavy rainfall: {rain_1h}mm",
                    "measurement": rain_1h
                })
        
        if snow:
            snow_1h = snow.get('1h', 0) or snow.get('3h', 0)
            if snow_1h > 0:  # Any snow
                adverse_conditions_found.append({
                    "type": "snow",
                    "description": f"Snowfall: {snow_1h}mm",
                    "measurement": snow_1h
                })
        
        # Check wind speed
        wind_speed = weather_info.get('wind_speed', 0)
        if wind_speed > 15:  # Strong wind threshold (m/s)
            adverse_conditions_found.append({
                "type": "strong_wind",
                "description": f"Strong winds: {wind_speed} m/s",
                "measurement": wind_speed
            })
        
        # Determine severity
        if len(adverse_conditions_found) > 0:
            severity_keywords = ['extreme', 'heavy', 'severe', 'thunderstorm', 'snow', 'blizzard']
            if any(keyword in weather_desc for keyword in severity_keywords):
                severity = "high"
            elif len(adverse_conditions_found) > 1:
                severity = "medium"
            else:
                severity = "low"
        
        has_adverse_weather = len(adverse_conditions_found) > 0
        
        # Generate justification
        justification = self._generate_justification(adverse_conditions_found, weather_desc)
        
        return {
            "has_adverse_weather": has_adverse_weather,
            "conditions": adverse_conditions_found,
            "severity": severity,
            "justification": justification,
            "weather_description": weather_desc,
            "temperature": weather_info.get('temp'),
            "wind_speed": wind_speed,
            "mock_data": weather_data.get('mock', False)
        }
    
    def _generate_justification(self, adverse_conditions: list, weather_desc: str) -> str:
        """Generate human-readable justification for weather impact"""
        if not adverse_conditions:
            return "No adverse weather conditions detected that would impact delivery."
        
        condition_descriptions = []
        for condition in adverse_conditions:
            if 'measurement' in condition:
                condition_descriptions.append(condition['description'])
            else:
                condition_descriptions.append(condition['type'].replace('_', ' ').title())
        
        if len(condition_descriptions) == 1:
            return f"Delivery delay justified due to adverse weather: {condition_descriptions[0]}. Weather conditions: {weather_desc}."
        else:
            conditions_str = ", ".join(condition_descriptions[:-1]) + f" and {condition_descriptions[-1]}"
            return f"Delivery delay justified due to multiple adverse weather conditions: {conditions_str}. Weather conditions: {weather_desc}."

# Create a global instance
weather_service = WeatherService()
