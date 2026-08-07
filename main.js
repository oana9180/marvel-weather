const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherContainer = document.getElementById("weatherContainer");
const historyContainer = document.getElementById("historyContainer");
const loading = document.getElementById("loading");
const message = document.getElementById("message");

let cities = JSON.parse(localStorage.getItem("marvelWeatherCities")) || [];

async function searchWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    showMessage("¡HEY! Primero escribe una ciudad.");
    return;
  }

  hideMessage();
  showLoading();

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=es`
    );

    if (!response.ok) throw new Error("Ciudad no encontrada");

    const data = await response.json();

    displayWeather(data);
    saveCity(data.name, data.sys.country);
    cityInput.value = "";
  } catch (error) {
    showMessage("¡POW! No encontramos esa ciudad. Intenta nuevamente.");
    weatherContainer.innerHTML = "";
  } finally {
    hideLoading();
  }
}

function displayWeather(data) {
  const temperature = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@4x.png`;
  const description = data.weather[0].description;

  weatherContainer.innerHTML = `
    <div class="weather-card">
      <div class="weather-card-header">
        <div>
          <h3>${escapeHtml(data.name)}</h3>
          <p>${escapeHtml(data.sys.country)}</p>
        </div>
        <button class="close-weather" id="closeWeather" title="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="weather-main">
        <img src="${iconUrl}" alt="${escapeHtml(description)}" class="weather-icon">
        <div class="temperature">${temperature}°C</div>
        <div class="description">${escapeHtml(description)}</div>
      </div>

      <div class="weather-details">
        <div class="detail-box">
          <i class="fa-solid fa-temperature-half"></i>
          <span>Sensación térmica</span>
          <strong>${feelsLike}°C</strong>
        </div>
        <div class="detail-box">
          <i class="fa-solid fa-droplet"></i>
          <span>Humedad</span>
          <strong>${data.main.humidity}%</strong>
        </div>
        <div class="detail-box">
          <i class="fa-solid fa-wind"></i>
          <span>Viento</span>
          <strong>${Math.round(data.wind.speed * 3.6)} km/h</strong>
        </div>
      </div>
    </div>
  `;

  document.getElementById("closeWeather").addEventListener("click", () => {
    weatherContainer.innerHTML = "";
  });
}

function saveCity(name, country) {
  const exists = cities.some(
    city => city.name === name && city.country === country
  );

  if (!exists) {
    cities.unshift({ name, country });
    cities = cities.slice(0, 8);
    localStorage.setItem("marvelWeatherCities", JSON.stringify(cities));
  }

  renderHistory();
}

function renderHistory() {
  if (cities.length === 0) {
    historyContainer.innerHTML = `
      <div class="text-center w-100">
        <p>Todavía no tienes ciudades guardadas.</p>
      </div>
    `;
    return;
  }

  historyContainer.innerHTML = cities.map((city, index) => `
    <div class="history-card" data-city="${escapeHtml(city.name)}">
      <button class="delete-history" data-index="${index}" title="Eliminar ciudad">
        <i class="fa-solid fa-trash"></i>
      </button>
      <i class="fa-solid fa-location-dot text-danger"></i>
      <h4>${escapeHtml(city.name)}</h4>
      <p>${escapeHtml(city.country)}</p>
    </div>
  `).join("");

  document.querySelectorAll(".history-card").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest(".delete-history")) return;
      cityInput.value = card.dataset.city;
      searchWeather();
      document.getElementById("buscar").scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll(".delete-history").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const index = Number(button.dataset.index);
      cities.splice(index, 1);
      localStorage.setItem("marvelWeatherCities", JSON.stringify(cities));
      renderHistory();
    });
  });
}

function showMessage(text) {
  message.textContent = text;
  message.classList.remove("d-none");
}

function hideMessage() {
  message.classList.add("d-none");
}

function showLoading() {
  loading.classList.remove("d-none");
}

function hideLoading() {
  loading.classList.add("d-none");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

searchBtn.addEventListener("click", searchWeather);

cityInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchWeather();
});

renderHistory();
