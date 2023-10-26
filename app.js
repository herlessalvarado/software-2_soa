const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(express.json());

async function getCoordinates(placeName) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${placeName}&format=json`
    );
    if (response.data && response.data[0]) {
      const { lat, lon } = response.data[0];
      return { latitude: lat, longitude: lon };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getWeatherForecast(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&forecast_days=7&daily=temperature_2m_max&timezone=PST`
    );

    if (response.data.daily) {
      const temperatureMax7Days = response.data.daily.temperature_2m_max;
      return temperatureMax7Days;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getNearbyRestaurants(latitude, longitude) {
  const bbox = `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${
    latitude + 0.01
  }`;

  try {
    const response = await axios.get(
      `https://api.openstreetmap.org/api/0.6/map.json?bbox=${bbox}`
    );

    const restaurants = response.data.elements.filter(
      (v) => v.tags && v.tags.amenity === "restaurant"
    );
    return restaurants;
  } catch (error) {
    console.log(error);
    return [];
  }
}

app.get("/api/v1/ciudad/:cityName/restaurantes", async (req, res) => {
  const placeName = req.params.cityName;

  const coordinates = await getCoordinates(placeName);

  if (!coordinates) {
    return res.status(404).json({ message: "Lugar no encontrado" });
  }

  const { latitude, longitude } = coordinates;

  const temperatureMax7Days = await getWeatherForecast(latitude, longitude);

  if (temperatureMax7Days === null) {
    return res.status(404).json({ message: "Pronóstico no encontrado" });
  }

  const nearbyRestaurants = await getNearbyRestaurants(latitude, longitude);

  if (nearbyRestaurants.length === 0) {
    return res.status(404).json({ message: "Restaurantes no encontrados" });
  }

  res.status(200).json({
    climaMañana: temperatureMax7Days[0],
    restaurantes: nearbyRestaurants.slice(0, 3),
  });
});

app.get("/api/v1/ciudad/:cityName/clima/manhana", async (req, res) => {
  const placeName = req.params.cityName;

  const coordinates = await getCoordinates(placeName);

  if (!coordinates) {
    return res.status(404).json({ message: "Lugar no encontrado" });
  }

  const { latitude, longitude } = coordinates;

  const temperatureMax7Days = await getWeatherForecast(latitude, longitude);

  if (temperatureMax7Days === null) {
    return res.status(404).json({ message: "Pronóstico no encontrado" });
  }

  res.status(200).json({
    climaMañana: temperatureMax7Days[0],
  });
});

app.get("/api/v1/ciudad/:cityName/clima/7dias", async (req, res) => {
  const placeName = req.params.cityName;

  const coordinates = await getCoordinates(placeName);

  if (!coordinates) {
    return res.status(404).json({ message: "Lugar no encontrado" });
  }

  const { latitude, longitude } = coordinates;

  const temperatureMax7Days = await getWeatherForecast(latitude, longitude);

  if (temperatureMax7Days === null) {
    return res.status(404).json({ message: "Pronóstico no encontrado" });
  }

  res.status(200).json({
    clima7Dias: temperatureMax7Days,
  });
});

app.listen(port, () => {
  console.log(`La aplicación está escuchando en el puerto ${port}`);
});
