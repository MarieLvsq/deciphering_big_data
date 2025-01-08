import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
//import schedule from "node-schedule";
import qs from "qs"; // Query String

dotenv.config();

// Schema for the lieuTravail which includes the GeoJSON location field
const lieuTravailSchema = new mongoose.Schema({
  libelle: String,
  codePostal: String,
  commune: String,
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
});

// Schema for the entreprise field
const entrepriseSchema = new mongoose.Schema({
  nom: String,
  description: String,
  logo: String,
  entrepriseAdaptee: Boolean,
});

// Schema for the salaire field
const salaireSchema = new mongoose.Schema({
  libelle: String,
});

// Schema for the contact field
const contactSchema = new mongoose.Schema({
  nom: String,
  coordonnees1: String,
  courriel: String,
});

// Schema for the qualitesProfessionnelles field
const qualitesProfessionnellesSchema = new mongoose.Schema({
  libelle: String,
  description: String,
});

// Main schema for the OffreEmploi
const offreSchema = new mongoose.Schema(
  {
    data: {
      id: String,
      intitule: String,
      description: String,
      dateCreation: Date,
      dateActualisation: Date,
      romeCode: String,
      romeLibelle: String,
      appellationlibelle: String,
      entreprise: entrepriseSchema,
      typeContrat: String,
      typeContratLibelle: String,
      natureContrat: String,
      experienceExige: String,
      experienceLibelle: String,
      salaire: salaireSchema,
      dureeTravailLibelle: String,
      dureeTravailLibelleConverti: String,
      alternance: Boolean,
      contact: contactSchema,
      nombrePostes: Number,
      accessibleTH: Boolean,
      qualificationCode: String,
      qualificationLibelle: String,
      codeNAF: String,
      secteurActivite: String,
      secteurActiviteLibelle: String,
      qualitesProfessionnelles: [qualitesProfessionnellesSchema],
      origineOffre: {
        origine: String,
        urlOrigine: String,
      },
      offresManqueCandidats: Boolean,
      lieuTravail: lieuTravailSchema,
    },
    __v: { type: Number, select: false }, // Exclude __v when querying
  },
  { strict: false }
); // Disable strict mode to accept fields not defined in the schema

const OffreEmploi = mongoose.model("Offres", offreSchema);

// Fonction pour récupérer et enregistrer les données d'une liste de villes
const cities = [
  "63113",
  "69381",
  "69382",
  "69383",
  "69384",
  "69385",
  "69386",
  "69387",
  "69388",
  "69389",
  "25056",
  "21231",
  "35238",
  "45234",
  "2A004",
  "2B033",
  "51108",
  "57463",
  "67482",
  "80021",
  "59350",
  "75101",
  "75102",
  "75103",
  "75104",
  "75105",
  "75106",
  "75107",
  "75108",
  "75109",
  "75110",
  "75111",
  "75112",
  "75113",
  "75114",
  "75115",
  "75116",
  "75117",
  "75118",
  "75119",
  "75120",
  "14118",
  "76540",
  "33063",
  "87085",
  "86194",
  "34172",
  "31555",
  "13201",
  "13202",
  "13203",
  "13204",
  "13205",
  "13206",
  "13207",
  "13208",
  "13209",
  "13210",
  "13211",
  "13212",
  "13213",
  "13214",
  "13215",
  "13216",
  "44109",
  "97105",
  "97209",
  "97302",
  "97411",
  "97611",
  "16015",
  "17300",
  "18033",
  "19272",
  "01053",
  "02408",
  "03190",
  "04070",
  "05061",
  "06088",
  "07186",
  "08105",
  "09122",
  "10387",
  "11069",
  "12202",
  "15014",
  "22278",
  "23096",
  "24322",
  "26362",
  "27229",
  "28085",
  "29232",
  "30189",
  "32013",
  "36044",
  "37261",
  "38185",
  "39300",
  "40192",
  "41018",
  "42218",
  "43157",
  "46042",
  "47001",
  "48095",
  "49007",
  "50502",
  "52121",
  "53130",
  "54395",
  "55029",
  "58194",
  "60057",
  "61001",
  "62041",
  "64445",
  "65440",
  "66136",
  "68066",
  "70550",
  "71270",
  "72181",
  "73065",
  "74010",
  "77288",
  "78646",
  "79191",
  "81004",
  "82121",
  "83137",
  "84007",
  "85191",
  "88160",
  "89024",
  "90010",
];

// Initially set the token to null
let accessToken = null;
let tokenExpiration = null;

async function obtainAccessToken() {
  const now = new Date();

  // Refresh token if it's close to expiration (e.g., within 5 minutes)
  if (accessToken && tokenExpiration > new Date(now.getTime() + 5 * 60000)) {
    return accessToken;
  }

  // Token is not set or expired, we need to get a new one
  const params = {
    grant_type: "client_credentials",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLE_SECRETE,
    scope: "api_offresdemploiv2 o2dsoffre",
  };

  try {
    const response = await axios.post(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire",
      qs.stringify(params),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Store the new token and calculate its expiration time
    accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in; // The API should provide the expiration time
    tokenExpiration = new Date(now.getTime() + expiresIn * 1000 - 5 * 60000); // Subtract 5 minutes to be safe

    return accessToken;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

async function fetchAndSaveOffersByCity(city) {
  let hasMore = true;
  let page = 1;
  const maxRange = 150; // Max range allowed by the API for a single request

  while (hasMore) {
    try {
      const token = await obtainAccessToken(); // Obtain a fresh token for each request
      const response = await axios.get(
        `https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search?commune=${encodeURIComponent(
          city
        )}&range=${(page - 1) * maxRange}-${
          page * maxRange - 1
        }&publieeDepuis=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const offers = response.data.resultats || [];
      for (const offerData of offers) {
        // Transform the latitude and longitude into a GeoJSON format
        if (
          offerData.lieuTravail &&
          offerData.lieuTravail.latitude &&
          offerData.lieuTravail.longitude
        ) {
          offerData.lieuTravail.location = {
            type: "Point",
            coordinates: [
              offerData.lieuTravail.longitude,
              offerData.lieuTravail.latitude,
            ],
          };
        }

        // Update the database entry for the offer
        await OffreEmploi.updateOne(
          { "data.id": offerData.id },
          { $set: { data: offerData } },
          { upsert: true }
        );
      }

      hasMore = offers.length === maxRange && response.status === 206; // Assumes 206 is a partial content success status
      page++;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Token might be expired, refresh it
        await obtainAccessToken();
        // Decrement page to retry the failed request
        if (page > 1) {
          page--;
        }
      } else {
        console.error(
          `Error fetching data for city ${city}:`,
          error.response?.data || error.message
        );
        hasMore = false; // Stop the loop on error
      }
    }
  }
}

async function deleteOldOffers() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  await OffreEmploi.deleteMany({
    "data.dateCreation": { $lt: sevenDaysAgo.toISOString() },
  });
}

async function runPoleEmploiOffers() {
  try {
    for (const city of cities) {
      await fetchAndSaveOffersByCity(city); // The token is managed inside this function
    }
    await deleteOldOffers();
    console.log("Fetching and saving offers complete.");
  } catch (error) {
    console.error("An error occurred in runPoleEmploiOffers:", error);
    throw error;
  }
}

export { runPoleEmploiOffers };
