import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3003;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Whitelist allowed files (critical for security)
const ALLOWED_FILES = new Set(
  fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"))
);

const readJson = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

// ---- Routes ----

// Root route
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hotel API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        .endpoint { background: #f4f4f4; padding: 10px; margin: 10px 0; border-radius: 5px; }
        code { background: #e8e8e8; padding: 2px 6px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>🏨 Hotel API</h1>
      <p>Welcome to the Hotel API. Available endpoints:</p>
      
      <div class="endpoint">
        <strong>GET /countries</strong>
        <p>Get list of all available countries</p>
        <code>Example: /countries</code>
      </div>
      
      <div class="endpoint">
        <strong>GET /data/:country</strong>
        <p>Get all cities for a country</p>
        <code>Example: /data/thai</code>
      </div>
      
      <div class="endpoint">
        <strong>GET /data/:country/city/:planningId</strong>
        <p>Get a specific city by planning ID</p>
        <code>Example: /data/thai/city/1</code>
      </div>
      
      <p>Available countries: aust, japen, singa, thai, unitedarab, viet</p>
    </body>
    </html>
  `);
});

// GET /countries - List all available countries
app.get("/countries", (req, res) => {
  const countries = Array.from(ALLOWED_FILES)
    .filter(f => f !== 'data.json')
    .map(f => f.replace('.json', ''));
  
  res.json({
    countries: countries,
    count: countries.length
  });
});

// GET /data/:country
app.get("/data/:country", (req, res) => {
  const file = `${req.params.country.toLowerCase()}.json`;

  if (!ALLOWED_FILES.has(file)) {
    const availableCountries = Array.from(ALLOWED_FILES)
      .filter(f => f !== 'data.json')
      .map(f => f.replace('.json', ''))
      .join(', ');
    
    return res.status(404).json({ 
      error: "Country not found",
      requested: req.params.country,
      availableCountries: availableCountries
    });
  }

  try {
    const data = readJson(file);
    res.json(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
    res.status(500).json({ error: "Failed to load data", details: error.message });
  }
});

app.get("/data/:country/city/:planningId", (req, res) => {
  const file = `${req.params.country.toLowerCase()}.json`;

  if (!ALLOWED_FILES.has(file)) {
    const availableCountries = Array.from(ALLOWED_FILES)
      .filter(f => f !== 'data.json')
      .map(f => f.replace('.json', ''))
      .join(', ');
    
    return res.status(404).json({ 
      error: "Country not found",
      requested: req.params.country,
      availableCountries: availableCountries
    });
  }

  try {
    const data = readJson(file);
    const city = data.find(
      c => String(c["Planning Id"]) === req.params.planningId
    );

    if (!city) {
      return res.status(404).json({ 
        error: "City not found",
        planningId: req.params.planningId,
        country: req.params.country
      });
    }

    res.json(city);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
    res.status(500).json({ error: "Failed to load city", details: error.message });
  }
});


// ---- Start server ----
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
