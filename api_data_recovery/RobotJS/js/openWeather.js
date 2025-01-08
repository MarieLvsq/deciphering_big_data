import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Modèle Mongoose pour une offre d'emploi
const AirQualitySchema = new mongoose.Schema(
  {
    city: String,
    aqi: Number,
    co: Number,
    no: Number,
    no2: Number,
    o3: Number,
    so2: Number,
    pm2_5: Number,
    pm10: Number,
    nh3: Number,
    date: Date,
  },
  { timestamps: true }
);

const AirQuality = mongoose.model("AirQuality", AirQualitySchema);

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

async function runAirQualityCheck() {
  async function getLocationData(cityName) {
    try {
      let geoEndpoint;
      if (cityName === "Saint-Denis-La-Reunion") {
        const lat = -20.8789;
        const lon = 55.4481;
        geoEndpoint = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
      } else {
        geoEndpoint = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      }
      const geoResponse = await axios.get(geoEndpoint);

      if (geoResponse.data.length === 0) {
        console.log("Location not found for city:", cityName);
        return;
      }

      const { lat, lon } = geoResponse.data[0];

      // Fetch air pollution data based on lat & lon
      await fetchAndSaveAirQualityData({ name: cityName, lat, lon });
    } catch (error) {
      console.error("Error fetching location data for city:", cityName, error);
    }
  }

  const fetchAndSaveAirQualityData = async ({ name, lat, lon }) => {
    try {
      if (!name) {
        console.error(`Name is undefined for the coordinates: ${lat}, ${lon}`);
        return;
      } else {
        const response = await axios.get(
          "http://api.openweathermap.org/data/2.5/air_pollution",
          {
            params: {
              lat: lat,
              lon: lon,
              appid: OPENWEATHER_API_KEY,
            },
          }
        );

        const { data } = response;
        if (data && data.list && data.list.length > 0) {
          const { main, components } = data.list[0];
          const newData = new AirQuality({
            // This object contains the new data to be saved
            city:
              name === "Saint-Denis-La-Reunion"
                ? "Saint-Denis, La Réunion"
                : name,
            aqi: main.aqi,
            co: components.co,
            no: components.no,
            no2: components.no2,
            o3: components.o3,
            so2: components.so2,
            pm2_5: components.pm2_5,
            pm10: components.pm10,
            nh3: components.nh3,
            date: new Date(data.list[0].dt * 1000),
          });

          // Save the new document to the database
          await newData.save();
          console.log(`Air quality data for ${name} added to the database.`);
        }
      }
    } catch (error) {
      console.error(`Error fetching air quality data for ${name}: `, error);
    }
  };

  async function fetchAndSaveDataForAllCities() {
    for (const cityName of cities) {
      await getLocationData(cityName);
      // Removed the erroneous standalone call to fetchAndSaveAirQualityData()
    }
  }

  await fetchAndSaveDataForAllCities();
}
export { runAirQualityCheck };
