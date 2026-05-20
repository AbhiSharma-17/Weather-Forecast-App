import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseEnabled } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, setDoc, doc, deleteDoc } from 'firebase/firestore';


export interface Alert {
  id: string;
  type: string;
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  active: boolean;
}

export interface DisasterRisk {
  flood: number;
  heatwave: number;
  cyclone: number;
  tsunami: number;
}

export interface CityWeatherData {
  name: string;
  coordinates: [number, number];
  status: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  aqi: number;
  uvIndex: number;
  precipitationProbability: number;
  condition: 'Sunny' | 'Rain' | 'Thunderstorm' | 'Clouds' | 'Fog';
  tempPrediction: number;
  disasterRisk: DisasterRisk;
  alerts: Alert[];
  soilMoisture: number;
  soilPh: number;
  historicalAqi: number[];
  historicalTemp: number[];
}

export interface ChatMessage {
  id: string;
  sender: 'User' | 'ClimateVision AI';
  message: string;
  timestamp: string;
}

interface WeatherContextType {
  cities: CityWeatherData[];
  selectedCityName: string;
  selectedCity: CityWeatherData | null;
  activePage: string;
  isLoading: boolean;
  chatHistory: ChatMessage[];
  audioTelemetryEnabled: boolean;
  unitSystem: 'metric' | 'imperial';
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  signOut: () => Promise<void>;
  setUnitSystem: (unit: 'metric' | 'imperial') => void;
  setSelectedCityName: (name: string) => void;
  setActivePage: (page: string) => void;
  updateCityWeather: (cityName: string, fields: Partial<CityWeatherData>) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;
  fetchWeatherData: () => Promise<void>;
  setAudioTelemetryEnabled: (enabled: boolean) => void;
  addCustomLocation: (name: string, lat: number, lon: number) => Promise<void>;
  loadRegionalGrid: (region: string) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

const API_BASE = 'http://localhost:3001/api';

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<CityWeatherData[]>([]);
  const [selectedCityName, setSelectedCityName] = useState<string>("Neo-Tokyo");
  const [activePage, setActivePage] = useState<string>("landing");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [audioTelemetryEnabled, setAudioTelemetryEnabled] = useState<boolean>(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ClimateVision AI",
      message: "[CLIMATEVISION SECURE SHELL] Core initialized. Atmospheric grid telemetry synced. System ready to receive parameters.",
      timestamp: new Date().toISOString()
    }
  ]);
  // Firebase auth user state
  const [user, setUser] = useState<any>(null);

  const fetchWeatherData = async () => {
    setIsLoading(true);
    try {
      let data: CityWeatherData[] = [];
      const res = await fetch(`${API_BASE}/weather`);
      if (res.ok) {
        data = await res.json();
      }

      // OpenWeatherMap Real-Time Fallback Logic
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (apiKey && apiKey !== "") {
        console.log("OpenWeather API key detected. Fetching real-time weather layers...");
        // Here we map our mock cities to real world counterparts
        const realCityMap: Record<string, string> = {
          "Neo-Tokyo": "Tokyo",
          "Neo-London": "London",
          "New New York": "New York",
          "Cyber-Mumbai": "Mumbai",
          "Sector 7 (Paris)": "Paris",
          "Mars Colony Alpha": "Dubai" // Fallback real city for Mars
        };

        const updatedData = await Promise.all(data.map(async (city) => {
          const realName = realCityMap[city.name] || city.name;
          try {
            const owmRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${realName}&units=${unitSystem}&appid=${apiKey}`);
            if (owmRes.ok) {
              const owmData = await owmRes.json();
              // Determine condition
              const conditionsMap: Record<string, CityWeatherData['condition']> = {
                Clear: 'Sunny',
                Clouds: 'Clouds',
                Rain: 'Rain',
                Drizzle: 'Rain',
                Thunderstorm: 'Thunderstorm',
                Snow: 'Fog',
                Mist: 'Fog',
                Smoke: 'Fog',
                Haze: 'Fog',
                Dust: 'Fog',
                Fog: 'Fog'
              };
              const mainCondition = owmData.weather[0]?.main || 'Sunny';

              return {
                ...city,
                temperature: Math.round(owmData.main.temp),
                humidity: owmData.main.humidity,
                windSpeed: Math.round(unitSystem === 'metric' ? owmData.wind.speed * 3.6 : owmData.wind.speed), // Convert m/s to km/h if metric
                pressure: owmData.main.pressure,
                condition: conditionsMap[mainCondition] || 'Sunny'
              };
            }
          } catch (e) {
            console.error(`Failed to fetch real data for ${city.name}`, e);
          }
          return city;
        }));
        setCities(updatedData);
      } else {
        // Use default mock data
        setCities(data);
      }
    } catch (err) {
      console.error("Error fetching weather data from server:", err);
    } finally {
      // Small simulated delay for futuristic loader aesthetic
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Listen for Firebase auth state changes and sync data
  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u && db) {
          try {
            // Load custom cities
            const citiesSnapshot = await getDocs(collection(db, 'users', u.uid, 'customCities'));
            const customCities: CityWeatherData[] = [];
            citiesSnapshot.forEach((doc) => {
              customCities.push(doc.data() as CityWeatherData);
            });
            if (customCities.length > 0) {
              setCities(prev => [...customCities, ...prev.filter(c => !customCities.find(cc => cc.name === c.name))]);
            }
            
            // Load chat history
            const chatQuery = query(collection(db, 'users', u.uid, 'chatHistory'), orderBy('timestamp', 'asc'));
            const chatSnapshot = await getDocs(chatQuery);
            const history: ChatMessage[] = [];
            chatSnapshot.forEach((doc) => {
              history.push(doc.data() as ChatMessage);
            });
            if (history.length > 0) {
              setChatHistory(history);
            }
          } catch (err) {
            console.error("Failed to sync cloud telemetry:", err);
          }
        } else {
          // Check for mock user in localStorage if logged out / no firebase auth
          const mock = localStorage.getItem('climatevision_mock_user');
          if (mock) setUser(JSON.parse(mock));
        }
      });
      return () => unsub();
    } else {
      // Check for mock user in localStorage
      const mock = localStorage.getItem('climatevision_mock_user');
      if (mock) setUser(JSON.parse(mock));
    }
  }, []);

  // Listen for storage events to sync mock auth state across tabs
  useEffect(() => {
    const handleStorage = () => {
      const mock = localStorage.getItem('climatevision_mock_user');
      setUser(mock ? JSON.parse(mock) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);


  useEffect(() => {
    fetchWeatherData();
  }, [unitSystem]);

  const selectedCity = cities.find(c => c.name.startsWith(selectedCityName)) || null;

  const updateCityWeather = async (cityName: string, fields: Partial<CityWeatherData>) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/update-weather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityName, ...fields })
      });
      if (res.ok) {
        await fetchWeatherData();
      }
    } catch (err) {
      console.error("Error updating city weather:", err);
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'User',
      message,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMsg]);

    try {
      // Build a compact summary of all tracked cities for the AI
      const allCitiesSummary = cities.map(c => 
        `${c.name}: ${c.temperature}°${unitSystem === 'metric' ? 'C' : 'F'}, ${c.condition}, Wind ${c.windSpeed}km/h, AQI ${c.aqi}, Humidity ${c.humidity}%`
      ).join(' | ');

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          activeCity: selectedCityName,
          activeCityData: selectedCity,
          allCitiesSummary
        })
      });
      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: 'ClimateVision AI',
          message: data.message,
          timestamp: data.timestamp
        };
        setChatHistory(prev => [...prev, aiMsg]);
        
        // Sync to cloud
        if (isFirebaseEnabled && db && user?.uid) {
          try {
            await addDoc(collection(db, 'users', user.uid, 'chatHistory'), userMsg);
            await addDoc(collection(db, 'users', user.uid, 'chatHistory'), aiMsg);
          } catch(e) { console.error("Cloud chat sync failed", e); }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ClimateVision AI',
        message: "[CLIMATEVISION COMM ERROR] Failed to connect to local language module. Verify Node.js backend port status.",
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    }
  };

  const clearChatHistory = async () => {
    const welcomeMsg: ChatMessage = {
      id: "welcome",
      sender: "ClimateVision AI",
      message: "[CLIMATEVISION SECURE SHELL] History wiped. Global monitors recalibrating. Database ready.",
      timestamp: new Date().toISOString()
    };
    setChatHistory([welcomeMsg]);
    
    // Attempt cloud wipe if authenticated
    if (isFirebaseEnabled && db && user?.uid) {
      try {
        const chatDocs = await getDocs(collection(db, 'users', user.uid, 'chatHistory'));
        chatDocs.forEach(async (d) => {
          await deleteDoc(doc(db, 'users', user.uid, 'chatHistory', d.id));
        });
        await addDoc(collection(db, 'users', user.uid, 'chatHistory'), welcomeMsg);
      } catch(e) { console.error("Cloud chat wipe failed", e); }
    }
  };

  const addCustomLocation = async (name: string, lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      
      let temp = 20;
      let humidity = 50;
      let windSpeed = 15;
      let windDirection = "ENE";
      let pressure = 1012;
      let aqi = 45;
      let uvIndex = 5.0;
      let cond: CityWeatherData['condition'] = "Clouds";
      let alerts: Alert[] = [];

      if (apiKey && apiKey !== "") {
        // Fetch weather
        try {
          const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unitSystem}&appid=${apiKey}`);
          if (wRes.ok) {
            const wData = await wRes.json();
            temp = Math.round(wData.main.temp);
            humidity = wData.main.humidity;
            windSpeed = Math.round(unitSystem === 'metric' ? wData.wind.speed * 3.6 : wData.wind.speed);
            pressure = wData.main.pressure;
            
            // Wind Direction mapping
            if (wData.wind.deg !== undefined) {
              const val = Math.floor((wData.wind.deg / 22.5) + 0.5);
              const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
              windDirection = arr[(val % 16)];
            }

            const conditionsMap: Record<string, CityWeatherData['condition']> = {
              Clear: 'Sunny', Clouds: 'Clouds', Rain: 'Rain', Drizzle: 'Rain', Thunderstorm: 'Thunderstorm', Mist: 'Fog', Haze: 'Fog', Fog: 'Fog'
            };
            cond = conditionsMap[wData.weather[0]?.main] || 'Sunny';
          }
        } catch (err) {
          console.error("Failed OWM custom weather fetch", err);
        }

        // Fetch AQI
        try {
          const aRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
          if (aRes.ok) {
            const aData = await aRes.json();
            const aqiMap = [15, 35, 75, 125, 185];
            const rawIndex = aData.list[0]?.main?.aqi || 2;
            aqi = aqiMap[rawIndex - 1] || 55;
          }
        } catch (err) {
          console.error("Failed OWM custom AQI fetch", err);
        }
      }

      // Generate alert based on condition/aqi
      if (aqi > 100) {
        alerts.push({
          id: `custom-aqi-${Date.now()}`,
          type: "Air Quality Alert",
          level: "High",
          message: `Atmospheric micro-particles spike registered at ${aqi} index. Filter mask activation advised in localized sectors.`,
          active: true
        });
      }
      if (temp > (unitSystem === 'metric' ? 38 : 100)) {
        alerts.push({
          id: `custom-heat-${Date.now()}`,
          type: "Heatwave Alert",
          level: "Critical",
          message: `Extreme local thermal index registered at ${temp}°${unitSystem === 'metric' ? 'C' : 'F'}. Activating cooling grids.`,
          active: true
        });
      }

      const soilMoisture = Math.min(100, Math.max(10, Math.round(85 - temp * 1.5)));
      const soilPh = parseFloat((6.0 + Math.random() * 1.5).toFixed(1));

      const newCity: CityWeatherData = {
        name,
        coordinates: [lon, lat],
        status: alerts.length > 0 ? "Critical Warning" : "Operational",
        temperature: temp,
        humidity,
        windSpeed,
        windDirection,
        pressure,
        aqi,
        uvIndex,
        precipitationProbability: cond === "Thunderstorm" ? 95 : cond === "Rain" ? 80 : cond === "Clouds" ? 35 : 5,
        condition: cond,
        tempPrediction: parseFloat((temp + (Math.random() * 2 - 1)).toFixed(1)),
        disasterRisk: {
          flood: cond === "Thunderstorm" ? 85 : cond === "Rain" ? 50 : 5,
          heatwave: temp > (unitSystem === 'metric' ? 35 : 95) ? 90 : 10,
          cyclone: windSpeed > (unitSystem === 'metric' ? 40 : 25) ? 65 : 5,
          tsunami: 0
        },
        alerts,
        soilMoisture,
        soilPh,
        historicalAqi: Array.from({ length: 12 }, () => Math.round(aqi * (0.8 + Math.random() * 0.4))),
        historicalTemp: Array.from({ length: 12 }, () => Math.round(temp * (0.7 + Math.random() * 0.5)))
      };

      setCities(prev => {
        const filtered = prev.filter(c => c.name !== name);
        return [newCity, ...filtered];
      });
      
      setSelectedCityName(name);

      // Cloud sync
      if (isFirebaseEnabled && db && user?.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'customCities', name), newCity);
        } catch(e) { console.error("Cloud custom location sync failed", e); }
      }

    } catch (err) {
      console.error("Error adding custom location:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegionalGrid = async (region: string) => {
    setIsLoading(true);
    try {
      const regionMap: Record<string, {name: string, lat: number, lon: number}[]> = {
        "India": [
          { name: "Maharashtra (Mumbai)", lat: 19.0760, lon: 72.8777 },
          { name: "Delhi", lat: 28.7041, lon: 77.1025 },
          { name: "Karnataka (Bangalore)", lat: 12.9716, lon: 77.5946 },
          { name: "Tamil Nadu (Chennai)", lat: 13.0827, lon: 80.2707 },
          { name: "West Bengal (Kolkata)", lat: 22.5726, lon: 88.3639 },
          { name: "Gujarat (Ahmedabad)", lat: 23.0225, lon: 72.5714 },
          { name: "Rajasthan (Jaipur)", lat: 26.9124, lon: 75.7873 },
          { name: "Uttar Pradesh (Lucknow)", lat: 26.8467, lon: 80.9462 }
        ],
        "USA": [
          { name: "New York", lat: 40.7128, lon: -74.0060 },
          { name: "California (LA)", lat: 34.0522, lon: -118.2437 },
          { name: "Texas (Houston)", lat: 29.7604, lon: -95.3698 },
          { name: "Florida (Miami)", lat: 25.7617, lon: -80.1918 },
          { name: "Illinois (Chicago)", lat: 41.8781, lon: -87.6298 }
        ]
      };

      const targets = regionMap[region];
      if (!targets) {
        console.warn(`No predefined grid for region: ${region}`);
        setIsLoading(false);
        return;
      }

      // Add each city to the grid
      for (const t of targets) {
        await addCustomLocation(t.name, t.lat, t.lon);
      }
      
    } catch (e) {
      console.error("Failed to load regional grid", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WeatherContext.Provider value={{
      cities,
      selectedCityName,
      selectedCity,
      activePage,
      isLoading,
      chatHistory,
      audioTelemetryEnabled,
      unitSystem,
      user,
      setUser,
      signOut: async () => {
        if (isFirebaseEnabled && auth) {
          await firebaseSignOut(auth);
        } else {
          localStorage.removeItem('climatevision_mock_user');
          setUser(null);
        }
      },
      setUnitSystem,
      setSelectedCityName,
      setActivePage,
      updateCityWeather,
      sendChatMessage,
      clearChatHistory,
      fetchWeatherData,
      setAudioTelemetryEnabled,
      addCustomLocation,
      loadRegionalGrid
    }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
