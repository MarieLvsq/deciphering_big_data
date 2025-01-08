import mongoose from "mongoose";
import dotenv from "dotenv";
import { runAirQualityCheck } from "./js/openWeather.js";
import { runPoleEmploiOffers } from "./js/poleEmploiDb.js";
import { runWAQICheck } from "./js/waqiTileMap.js";
import express from "express";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;

async function connectToDatabase() {
  try {
    const conn = await mongoose.connect(process.env.DB_CONNECTION_STRING, {
      user: process.env.DB_USER,
      pass: process.env.DB_PSSWD,
      authSource: "admin",
    });
    console.log("Connected to MongoDB.");
    return conn;
  } catch (err) {
    console.error("Connection error", err);
    throw err; // Rethrow to handle the rejection in the main function
  }
}

async function runAllScripts() {
  try {
    console.log("Starting Pole Emploi Offers Check...");
    await runPoleEmploiOffers();
    console.log("Pole Emploi Offers Check completed.");

    console.log("Starting WAQI Check...");
    await runWAQICheck();
    console.log("WAQI Check completed.");

    console.log("Starting Air Quality Check...");
    await runAirQualityCheck();
    console.log("Air Quality Check completed.");
  } catch (err) {
    console.error("An error occurred in script execution:", err);
    throw err;
  }
}

async function main() {
  try {
    const dbConnection = await connectToDatabase();
    if (dbConnection) {
      await runAllScripts();
      console.log("All scripts completed.");
    }
  } catch (err) {
    console.error("An error occurred during the main process:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  main().catch((err) => {
    console.error("Main function encountered an error:", err);
    process.exit(1); // Exit the process if the main function fails
  });
});
