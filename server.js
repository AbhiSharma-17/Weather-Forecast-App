import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory Weather Database for futuristic stations
let weatherDatabase = {
  "Neo-Tokyo": {
    name: "Neo-Tokyo Sector 3",
    coordinates: [139.6917, 35.6895],
    status: "Operational",
    temperature: 24.5,
    humidity: 65,
    windSpeed: 18.2,
    windDirection: "ENE",
    pressure: 1012.4,
    aqi: 42,
    uvIndex: 4.8,
    precipitationProbability: 15,
    condition: "Sunny", // Sunny, Rain, Thunderstorm, Clouds, Fog
    tempPrediction: 25.1,
    disasterRisk: {
      flood: 12,
      heatwave: 8,
      cyclone: 4,
      tsunami: 2
    },
    alerts: [],
    soilMoisture: 42,
    soilPh: 6.4,
    historicalAqi: [48, 52, 45, 38, 41, 44, 42, 40, 39, 45, 48, 42],
    historicalTemp: [12, 14, 17, 21, 23, 26, 28, 29, 26, 21, 16, 13]
  },
  "New York Sector 7": {
    name: "New York Sector 7 Grid",
    coordinates: [-74.0060, 40.7128],
    status: "Operational",
    temperature: 16.8,
    humidity: 78,
    windSpeed: 28.5,
    windDirection: "WNW",
    pressure: 1008.1,
    aqi: 85,
    uvIndex: 2.1,
    precipitationProbability: 80,
    condition: "Rain",
    tempPrediction: 15.2,
    disasterRisk: {
      flood: 45,
      heatwave: 2,
      cyclone: 18,
      tsunami: 1
    },
    alerts: [
      { id: "ny-flood-1", type: "Flood Warning", level: "Medium", message: "Rising tides in Sector 7 coastal docks. Activate sub-surface drainage systems.", active: true }
    ],
    soilMoisture: 72,
    soilPh: 5.9,
    historicalAqi: [95, 90, 88, 70, 75, 82, 91, 88, 85, 80, 82, 85],
    historicalTemp: [4, 6, 9, 14, 19, 23, 26, 25, 21, 15, 10, 5]
  },
  "Paris Arc": {
    name: "Paris Arc Biosphere",
    coordinates: [2.3522, 48.8566],
    status: "Operational",
    temperature: 18.2,
    humidity: 55,
    windSpeed: 10.4,
    windDirection: "S",
    pressure: 1015.6,
    aqi: 35,
    uvIndex: 5.4,
    precipitationProbability: 10,
    condition: "Clouds",
    tempPrediction: 19.5,
    disasterRisk: {
      flood: 5,
      heatwave: 15,
      cyclone: 2,
      tsunami: 0
    },
    alerts: [],
    soilMoisture: 38,
    soilPh: 6.8,
    historicalAqi: [42, 40, 38, 32, 35, 39, 41, 38, 35, 34, 38, 35],
    historicalTemp: [6, 8, 11, 15, 18, 22, 25, 24, 20, 15, 10, 7]
  },
  "Mumbai Hub": {
    name: "Mumbai Megalopolis Hub",
    coordinates: [72.8777, 19.0760],
    status: "Critical Warning",
    temperature: 33.4,
    humidity: 88,
    windSpeed: 45.1,
    windDirection: "SW",
    pressure: 994.2,
    aqi: 145,
    uvIndex: 9.5,
    precipitationProbability: 95,
    condition: "Thunderstorm",
    tempPrediction: 31.8,
    disasterRisk: {
      flood: 88,
      heatwave: 40,
      cyclone: 72,
      tsunami: 15
    },
    alerts: [
      { id: "mum-cyclone-1", type: "Cyclone Warning", level: "Critical", message: "Cyclone 'Kraken' approaching the western harbor. Coastal barrier shields fully deployed.", active: true },
      { id: "mum-aqi-1", type: "Air Quality Alert", level: "High", message: "Sulfur dioxide spikes in chemical zones. Smart filtration masks recommended.", active: true }
    ],
    soilMoisture: 90,
    soilPh: 6.1,
    historicalAqi: [150, 162, 155, 130, 120, 95, 80, 85, 92, 110, 135, 145],
    historicalTemp: [26, 27, 29, 31, 32, 30, 28, 28, 28, 29, 28, 27]
  },
  "Sydney Grid": {
    name: "Sydney Harbor Thermal Grid",
    coordinates: [151.2093, -33.8688],
    status: "Operational",
    temperature: 39.8,
    humidity: 22,
    windSpeed: 24.6,
    windDirection: "NW",
    pressure: 1009.5,
    aqi: 110,
    uvIndex: 11.2,
    precipitationProbability: 2,
    condition: "Sunny",
    tempPrediction: 41.2,
    disasterRisk: {
      flood: 1,
      heatwave: 95,
      cyclone: 5,
      tsunami: 5
    },
    alerts: [
      { id: "syd-heat-1", type: "Heatwave Alert", level: "Critical", message: "Extreme temperatures detected. Grid thermal redistribution systems at maximum capacity.", active: true }
    ],
    soilMoisture: 15,
    soilPh: 7.2,
    historicalAqi: [60, 65, 72, 55, 48, 42, 38, 45, 52, 70, 88, 110],
    historicalTemp: [23, 23, 22, 19, 16, 14, 13, 14, 16, 18, 20, 22] // Southern hemisphere offset
  },
  "Nairobi Tech-Park": {
    name: "Nairobi Tech-Park Grid",
    coordinates: [36.8219, -1.2921],
    status: "Operational",
    temperature: 22.0,
    humidity: 50,
    windSpeed: 12.8,
    windDirection: "E",
    pressure: 1014.0,
    aqi: 28,
    uvIndex: 7.0,
    precipitationProbability: 5,
    condition: "Fog",
    tempPrediction: 22.5,
    disasterRisk: {
      flood: 4,
      heatwave: 10,
      cyclone: 1,
      tsunami: 0
    },
    alerts: [],
    soilMoisture: 48,
    soilPh: 6.5,
    historicalAqi: [32, 35, 30, 25, 22, 20, 18, 22, 24, 28, 30, 28],
    historicalTemp: [19, 20, 21, 20, 19, 18, 17, 18, 19, 20, 19, 19]
  }
};

// JavaScript double-exponential smoothing helper (matches Python ML logic)
function jsForecastFallback(history, steps = 7) {
  if (history.length < 2) {
    const val = history.length ? history[0] : 20.0;
    return Array(steps).fill(val);
  }

  const alpha = 0.5;
  const beta = 0.3;

  let level = history[0];
  let trend = history[1] - history[0];

  for (let i = 1; i < history.length; i++) {
    const val = history[i];
    const lastLevel = level;
    level = alpha * val + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  const forecast = [];
  for (let step = 1; step <= steps; step++) {
    const prediction = level + step * trend;
    const variation = 1.5 * Math.sin(step * 0.8);
    forecast.push(parseFloat((prediction + variation).toFixed(2)));
  }

  return forecast;
}

// REST Endpoints
app.get('/api/weather', (req, res) => {
  res.json(Object.values(weatherDatabase));
});

app.get('/api/weather/:city', (req, res) => {
  const city = req.params.city;
  const data = weatherDatabase[city];
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: "Station not found" });
  }
});

// Admin panel overrides
app.post('/api/update-weather', (req, res) => {
  const { city, temperature, humidity, windSpeed, aqi, uvIndex, condition, alerts } = req.body;
  if (!weatherDatabase[city]) {
    return res.status(404).json({ error: "Station not found" });
  }

  // Update properties
  if (temperature !== undefined) weatherDatabase[city].temperature = parseFloat(temperature);
  if (humidity !== undefined) weatherDatabase[city].humidity = parseInt(humidity);
  if (windSpeed !== undefined) weatherDatabase[city].windSpeed = parseFloat(windSpeed);
  if (aqi !== undefined) weatherDatabase[city].aqi = parseInt(aqi);
  if (uvIndex !== undefined) weatherDatabase[city].uvIndex = parseFloat(uvIndex);
  if (condition !== undefined) weatherDatabase[city].condition = condition;
  if (alerts !== undefined) {
    weatherDatabase[city].alerts = alerts;
    weatherDatabase[city].status = alerts.length > 0 ? "Critical Warning" : "Operational";
  }

  // Recalculate derivative values
  weatherDatabase[city].tempPrediction = parseFloat((weatherDatabase[city].temperature + (Math.random() * 2 - 1)).toFixed(1));
  weatherDatabase[city].precipitationProbability = condition === "Thunderstorm" ? 95 :
                                                    condition === "Rain" ? 80 :
                                                    condition === "Clouds" ? 35 :
                                                    condition === "Fog" ? 15 : 5;

  // Add custom risk shifts based on parameters
  if (weatherDatabase[city].temperature > 38) {
    weatherDatabase[city].disasterRisk.heatwave = 95;
  } else if (weatherDatabase[city].temperature < 30) {
    weatherDatabase[city].disasterRisk.heatwave = Math.max(5, weatherDatabase[city].disasterRisk.heatwave - 30);
  }

  if (weatherDatabase[city].condition === "Thunderstorm") {
    weatherDatabase[city].disasterRisk.flood = 85;
    weatherDatabase[city].disasterRisk.cyclone = 70;
  }

  res.json({ success: true, updated: weatherDatabase[city] });
});

// AI Forecasting endpoint utilizing python script with Node fallback
app.post('/api/forecast', (req, res) => {
  const { history, steps } = req.body;
  const inputData = {
    history: history || [20, 22, 23, 21, 24, 25, 26, 25, 27],
    steps: steps || 7
  };

  const jsonStr = JSON.stringify(inputData);
  const escapedJsonStr = jsonStr.replace(/"/g, '\\"');

  const pythonScript = path.join(__dirname, 'ml', 'forecast.py');

  // Try calling Python script
  exec(`python "${pythonScript}" "${escapedJsonStr}"`, (error, stdout, stderr) => {
    if (error) {
      // Fallback to JS calculation
      console.log("Python execution failed or not installed. Falling back to native JS forecast engine.");
      const forecast = jsForecastFallback(inputData.history, inputData.steps);
      return res.json({
        success: true,
        engine: "ClimateVision Core JS Engine (Local ML Fallback)",
        forecast
      });
    }

    try {
      const output = JSON.parse(stdout.trim());
      res.json(output);
    } catch (parseError) {
      const forecast = jsForecastFallback(inputData.history, inputData.steps);
      res.json({
        success: true,
        engine: "ClimateVision Core JS Engine (Local Parse Fallback)",
        forecast
      });
    }
  });
});

// AI Chatbot Assistant query logic
app.post('/api/chat', async (req, res) => {
  const { message, activeCity, activeCityData, allCitiesSummary } = req.body;
  const lowercaseMsg = message.toLowerCase();

  // Fuzzy match the city key in case frontend only sends the name and we need to fall back
  const cityKey = Object.keys(weatherDatabase).find(k => 
    (activeCity && activeCity.includes(k)) || 
    (activeCity && weatherDatabase[k].name === activeCity)
  ) || "Neo-Tokyo";

  // Use the live city data sent from the frontend (dynamic!), fall back to server DB only as last resort
  const cityData = activeCityData || weatherDatabase[cityKey];
  const cityName = cityData?.name || activeCity || "Unknown Station";

  let response = "";
  
  const geminiApiKey = process.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // Use the live allCitiesSummary from frontend if available, otherwise build from server DB
      const gridData = allCitiesSummary || Object.values(weatherDatabase).map(st => 
        `${st.name}: ${st.temperature}°C, ${st.condition}, Wind ${st.windSpeed}km/h, AQI ${st.aqi}`
      ).join(' | ');

      const prompt = `You are "ClimateVision AI", a highly advanced, slightly robotic sci-fi environmental monitoring assistant.
      
      The user is currently monitoring: ${cityName}
      Live telemetry for ${cityName}: Temp ${cityData.temperature}°, Condition ${cityData.condition}, Wind ${cityData.windSpeed}km/h, Humidity ${cityData.humidity}%, AQI ${cityData.aqi}
      
      All tracked stations on the global grid:
      ${gridData}
      
      IMPORTANT RULES:
      - If the user asks about a SPECIFIC city/location, find it in the global grid data and answer about THAT city.
      - If the user asks a general question without specifying a city, answer about their current target: ${cityName}.
      - NEVER default to Neo-Tokyo unless the user specifically asks about it or it is their active city.
      - Be dynamic — answer based on what the user actually asks.
      
      User message: "${message}"
      
      Respond directly and dynamically. Keep your response under 4 sentences. Speak in a clinical, futuristic, sci-fi tone. Start with a tag like [CLIMATEVISION CORE] or similar.`;
      
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      response = aiResponse.text;
    } catch (err) {
      console.warn("Gemini API Error, falling back to local processing:", err.message);
      response = "";
    }
  } 
  
  // Fallback to local logic if Gemini isn't available or fails
  if (!response) {
    if (lowercaseMsg.includes("rain") || lowercaseMsg.includes("precipitation")) {
      const prob = cityData.precipitationProbability ?? 20;
      const willRain = prob > 50;
      response = `[CLIMATE METRIC ANALYZER] Analysis for ${cityName} indicates a precipitation probability of ${prob}%. ${
        willRain 
          ? `Precipitation threshold exceeded. Recommendation: Activate moisture-shield protocols. Pressure reads ${cityData.pressure || 1012} hPa.` 
          : `Atmospheric moisture levels are stable. No immediate precipitation vectors detected.`
      }`;
    } 
    else if (lowercaseMsg.includes("temperature") || lowercaseMsg.includes("temp") || lowercaseMsg.includes("hot") || lowercaseMsg.includes("cold")) {
      response = `[THERMAL SCAN CORE] Current thermal reading for ${cityName}: ${cityData.temperature}°. Condition: ${cityData.condition}. Wind chill factor at ${cityData.windSpeed} km/h from ${cityData.windDirection || 'variable'}. Humidity index: ${cityData.humidity}%.`;
    }
    else if (lowercaseMsg.includes("travel") || lowercaseMsg.includes("suitability")) {
      const isBad = (cityData.aqi || 0) > 100 || (cityData.windSpeed || 0) > 35 || (cityData.temperature || 0) > 37;
      response = `[GLOBAL MOBILITY COMPLIANCE] Evaluating travel safety matrices for ${cityName}. ${
        isBad 
          ? `Advisory warning in place: AQI is ${cityData.aqi} and wind speed is ${cityData.windSpeed} km/h. Recommend delaying transports unless shields are equipped.`
          : `Safe flight window confirmed. Temperature at ${cityData.temperature}° with ${cityData.condition} skies. Turbulence is low (${cityData.windSpeed} km/h).`
      }`;
    } 
    else if (lowercaseMsg.includes("farming") || lowercaseMsg.includes("agriculture") || lowercaseMsg.includes("crop")) {
      const pH = cityData.soilPh || 6.5;
      const moisture = cityData.soilMoisture || 40;
      let crop = "Bio-Soy";
      if (moisture > 60) crop = "Hydro-Rice";
      else if (pH > 7.0) crop = "Exo-Potato";
      else if ((cityData.temperature || 20) > 30) crop = "Cyber-Wheat";
  
      response = `[AGRI-INTELLIGENCE CORE] Soil & Climate Analysis for ${cityName}:
  - Temperature: ${cityData.temperature}°
  - Soil pH: ${pH}
  - Soil Moisture: ${moisture}%
  Recommended crop variant: *${crop}*
  Irrigation protocol: ${moisture < 40 ? 'Initiate level 2 drip enrichment' : 'Status nominal, suspend supplemental moisture'}.`;
    }
    else if (lowercaseMsg.includes("disaster") || lowercaseMsg.includes("hazard") || lowercaseMsg.includes("alert")) {
      const alerts = cityData.alerts || [];
      if (alerts.length > 0) {
        response = `[EMERGENCY BROADCAST CORE] Active alerts in ${cityName}: ${alerts.map(a => `[${a.level} - ${a.type}] ${a.message}`).join(', ')}`;
      } else {
        const dr = cityData.disasterRisk || { flood: 0, cyclone: 0 };
        response = `[EMERGENCY BROADCAST CORE] Monitoring grid for ${cityName} shows no active warning vectors. Disaster risk parameters: Flood ${dr.flood}%, Cyclone ${dr.cyclone}%.`;
      }
    }
    else if (lowercaseMsg.includes("aqi") || lowercaseMsg.includes("pollution") || lowercaseMsg.includes("air")) {
      response = `[BIO-ENVIRONMENTAL SCAN] AQI index at ${cityName} is ${cityData.aqi || 'N/A'}. ${
        (cityData.aqi || 0) > 100 
          ? `Warning: Hazardous bio-particles detected. Filter mask levels 1-A required.` 
          : `Status: Atmospheric purity nominal. Respiration safety verified.`
      }`;
    }
    else if (lowercaseMsg.includes("wind")) {
      response = `[ANEMOMETRIC SCAN] Wind vector analysis for ${cityName}: Speed ${cityData.windSpeed} km/h from ${cityData.windDirection || 'variable'}. ${(cityData.windSpeed || 0) > 30 ? 'Warning: High velocity currents detected. Secure loose objects.' : 'Wind patterns nominal.'}`;
    }
    else if (lowercaseMsg.includes("humidity") || lowercaseMsg.includes("moisture")) {
      response = `[HYGROMETRIC CORE] Humidity index at ${cityName}: ${cityData.humidity}%. ${(cityData.humidity || 0) > 80 ? 'Elevated moisture levels detected — condensation risk high.' : 'Moisture levels within operational parameters.'}`;
    }
    else {
      response = `[CLIMATEVISION AI] Station ${cityName} is online. Current reading: ${cityData.temperature}°, ${cityData.condition}, AQI ${cityData.aqi || 'N/A'}. I can analyze precipitation, temperature, agriculture suitability, hazard alerts, AQI, wind, and humidity. Ask me anything about any city on your grid!`;
    }
  }

  res.json({
    sender: "ClimateVision AI",
    message: response,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[CLIMATEVISION BACKEND] Listening on port ${PORT}`);
});
