import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import schedule from "node-schedule";
import qs from "qs"; // Query String

dotenv.config();

const WAQI_API_KEY = process.env.WAQI_API_KEY;

// Modèle Mongoose pour la carte world air quality index
const waqiTileMapSchema = new mongoose.Schema({
  idx: Number,
  aqi: Number,
  time: {
    s: String,
    tz: String,
    v: Number,
    iso: String,
  },
  city: {
    geo: [Number], // Latitude and Longitude
    name: String,
    url: String,
  },
  dominentpol: String,
  iaqi: {
    co: { v: Number },
    h: { v: Number },
    no2: { v: Number },
    o3: { v: Number },
    p: { v: Number },
    pm10: { v: Number },
    pm25: { v: Number },
    so2: { v: Number },
    t: { v: Number },
    w: { v: Number },
  },
  attributions: [
    {
      url: String,
      name: String,
    },
  ],
  forecast: {
    daily: {
      o3: [
        {
          avg: Number,
          day: String,
          max: Number,
          min: Number,
        },
      ],
      pm10: [
        {
          avg: Number,
          day: String,
          max: Number,
          min: Number,
        },
      ],
      pm25: [
        {
          avg: Number,
          day: String,
          max: Number,
          min: Number,
        },
      ],
      uvi: [
        {
          avg: Number,
          day: String,
          max: Number,
          min: Number,
        },
      ],
      // Add more pollutants as needed
    },
  },
  debug: {
    sync: String,
  },
});

const WaqiTileMap = mongoose.model("WaqiTileMap", waqiTileMapSchema);
const cities = [
  "Clermont-Ferrand",
  "Lyon",
  "Besançon",
  "Dijon",
  "Rennes",
  "Orléans",
  "Ajaccio",
  "Bastia",
  "Châlons en Champagne",
  "Metz",
  "Strasbourg",
  "Amiens",
  "Lille",
  "Paris",
  "Caen",
  "Rouen",
  "Bordeaux",
  "Limoges",
  "Poitiers",
  "Montpellier",
  "Toulouse",
  "Marseille",
  "Nantes",
  "Basse-Terre",
  "Fort-de-France",
  "Cayenne",
  "Saint-Denis-La-Reunion",
  "Mamoudzou",
  "Angoulême",
  "La Rochelle",
  "Bourges",
  "Tulle",
  "Bourg-en-Bresse",
  "Laon",
  "Moulins",
  "Digne-les-Bains",
  "Gap",
  "Nice",
  "Privas",
  "Charleville-Mézières",
  "Foix",
  "Troyes",
  "Carcassonne",
  "Rodez",
  "Aurillac",
  "Saint-Brieuc",
  "Guéret",
  "Périgueux",
  "Valence",
  "Évreux",
  "Chartres",
  "Quimper",
  "Nîmes",
  "Auch",
  "Châteauroux",
  "Tours",
  "Grenoble",
  "Lons-le-Saunier",
  "Mont-de-Marsan",
  "Blois",
  "Saint-Étienne",
  "Le Puy-en-Velay",
  "Cahors",
  "Agen",
  "Mende",
  "Angers",
  "Saint-Lô",
  "Chaumont",
  "Laval",
  "Nancy",
  "Bar-le-Duc",
  "Vannes",
  "Nevers",
  "Beauvais",
  "Alençon",
  "Arras",
  "Pau",
  "Tarbes",
  "Perpignan",
  "Colmar",
  "Vesoul",
  "Mâcon",
  "Le Mans",
  "Chambéry",
  "Annecy",
  "Melun",
  "Versailles",
  "Niort",
  "Albi",
  "Montauban",
  "Toulon",
  "Avignon",
  "La Roche-sur-Yon",
  "Épinal",
  "Auxerre",
  "Belfort",
];

async function runWAQICheck() {
  try {
    for (const cityName of cities) {
      await fetchAndStoreAirQualityData(cityName);
    }
    console.log("All cities have been processed.");
  } catch (error) {
    console.error("An error occurred while processing the cities:", error);
  }
}

async function fetchAndStoreAirQualityData(cityName) {
  try {
    let airQualityEndpoint;
    if (cityName === "Saint-Denis-La-Reunion") {
      airQualityEndpoint = `https://api.waqi.info/feed/Saint-Denis, La Réunion/?token=${WAQI_API_KEY}`;
    } else {
      airQualityEndpoint = `https://api.waqi.info/feed/${cityName}/?token=${WAQI_API_KEY}`;
    }

    const airQualityResponse = await axios.get(airQualityEndpoint);
    const airQualityData = airQualityResponse.data;

    if (airQualityData.status === "ok") {
      const aqi = parseInt(airQualityData.data.aqi); // Parse the aqi as an integer
      if (!isNaN(aqi)) {
        const newData = {
          idx: airQualityData.data.idx,
          aqi: aqi, // Use the parsed aqi value
          time: airQualityData.data.time,
          city: airQualityData.data.city,
          attributions: airQualityData.data.attributions,
          iaqi: airQualityData.data.iaqi,
          forecast: airQualityData.data.forecast,
        };

        // Update or insert new data in MongoDB based on the city name
        await WaqiTileMap.findOneAndUpdate({ "city.name": cityName }, newData, {
          upsert: true, // Create a new record if it doesn't exist
          new: true, // Return the updated record
        });

        console.log(
          `Air quality data for ${cityName} updated or inserted in MongoDB.`
        );
      } else {
        console.log(
          `Invalid aqi value for ${cityName}: ${airQualityData.data.aqi}`
        );
      }
    } else {
      console.log(`Error fetching air quality data for ${cityName}.`);
    }
  } catch (error) {
    console.error(`Error fetching data for ${cityName}:`, error);
  }
}

export { runWAQICheck };
