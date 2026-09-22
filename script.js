const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const unitToggle = document.getElementById("unitToggle");
const message = document.getElementById("message");

const cityName = document.getElementById("cityName");
const currentTime = document.getElementById("currentTime");
const weatherIcon = document.getElementById("weatherIcon");
const weatherText = document.getElementById("weatherText");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const rainChance = document.getElementById("rainChance");
const sunriseTime = document.getElementById("sunriseTime");

const forecastList = document.getElementById("forecastList");

let selectedUnit = "fahrenheit";
let lastSearchedCity = "Chicago";

searchBtn.addEventListener("click", searchWeather);

cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    searchWeather();
  }
});

unitToggle.addEventListener("click", function () {
  if (selectedUnit === "fahrenheit") {
    selectedUnit = "celsius";
    unitToggle.textContent = "°C";
  } else {
    selectedUnit = "fahrenheit";
    unitToggle.textContent = "°F";
  }

  cityInput.value = lastSearchedCity;
  searchWeather();
});

window.addEventListener("load", function () {
  cityInput.value = lastSearchedCity;
  searchWeather();
});

async function searchWeather() {
  const city = cityInput.value.trim();

  if (city === "") {
    showMessage("Please enter a city name.");
    return;
  }

  lastSearchedCity = city;
  showMessage("Loading weather...");

  try {
    const location = await getCityLocation(city);

    if (!location) {
      showMessage("City not found. Please try another city.");
      return;
    }

    await getWeather(location);
    showMessage("");
  } catch (error) {
    showMessage("Something went wrong. Please try again.");
  }
}

async function getCityLocation(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  return data.results[0];
}

async function getWeather(location) {
  const windUnit = selectedUnit === "fahrenheit" ? "mph" : "kmh";

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,precipitation_probability_max` +
    `&temperature_unit=${selectedUnit}` +
    `&wind_speed_unit=${windUnit}` +
    `&timezone=auto` +
    `&forecast_days=5`;

  const response = await fetch(url);
  const data = await response.json();

  updateCurrentWeather(data.current, data.daily, location);
  updateForecast(data.daily);
}

function updateCurrentWeather(current, daily, location) {
  const weather = getWeatherInfo(current.weather_code);
  const windText = selectedUnit === "fahrenheit" ? "mph" : "km/h";

  cityName.textContent = `${location.name}, ${location.country}`;
  currentTime.textContent = formatTime(current.time);

  weatherIcon.textContent = weather.icon;
  weatherText.textContent = weather.text;

  temperature.textContent = `${Math.round(current.temperature_2m)}°`;
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;

  humidity.textContent = `${current.relative_humidity_2m}%`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} ${windText}`;
  rainChance.textContent = `${daily.precipitation_probability_max[0] ?? 0}%`;
  sunriseTime.textContent = formatTime(daily.sunrise[0]);
}

function updateForecast(daily) {
  forecastList.innerHTML = "";

  for (let i = 0; i < daily.time.length; i++) {
    const weather = getWeatherInfo(daily.weather_code[i]);

    const forecastItem = document.createElement("div");
    forecastItem.classList.add("forecast-item");

    forecastItem.innerHTML = `
      <div>
        <p class="forecast-day">${formatDay(daily.time[i])}</p>
        <p class="forecast-condition">${weather.icon} ${weather.text}</p>
      </div>

      <p class="forecast-temp">
        ${Math.round(daily.temperature_2m_max[i])}° /
        ${Math.round(daily.temperature_2m_min[i])}°
      </p>
    `;

    forecastList.appendChild(forecastItem);
  }
}

function getWeatherInfo(code) {
  if (code === 0) {
    return {
      text: "Clear Sky",
      icon: "☀️"
    };
  }

  if (code >= 1 && code <= 3) {
    return {
      text: "Partly Cloudy",
      icon: "⛅"
    };
  }

  if (code === 45 || code === 48) {
    return {
      text: "Foggy",
      icon: "🌫️"
    };
  }

  if (code >= 51 && code <= 67) {
    return {
      text: "Light Rain",
      icon: "🌧️"
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      text: "Snowy",
      icon: "❄️"
    };
  }

  if (code >= 80 && code <= 82) {
    return {
      text: "Rain Showers",
      icon: "🌦️"
    };
  }

  if (code >= 95) {
    return {
      text: "Thunderstorm",
      icon: "⛈️"
    };
  }

  return {
    text: "Cloudy",
    icon: "☁️"
  };
}

function formatTime(dateText) {
  const date = new Date(dateText);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDay(dateText) {
  const date = new Date(dateText);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function showMessage(text) {
  message.textContent = text;
}