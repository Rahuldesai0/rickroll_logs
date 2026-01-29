require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;

// TLS options to fix deployment connection issues
const client = new MongoClient(MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
});
let collection;

async function start() {
  await client.connect();
  const db = client.db("qrdb");
  collection = db.collection("hits");

  app.get("/", async (req, res) => {
    const now = new Date().toISOString();
    await collection.insertOne({ timestamp: now });
    res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  app.get("/count", async (req, res) => {
    const c = await collection.countDocuments();
    res.send(c.toString());
  });

  app.get("/csv", async (req, res) => {
    const rows = await collection.find().toArray();
    let csv = "timestamp\n";
    rows.forEach(r => {
      csv += r.timestamp + "\n";
    });
    res.type("text/plain").send(csv);
  });

  app.get("/reset", async (req, res) => {
    await collection.deleteMany({});
    res.send("reset");
  });

  // self ping (optional)
  setInterval(() => {
    http.get(`http://localhost:${PORT}/count`, () => {});
  }, 4 * 60 * 1000);

  app.listen(PORT);
}

start();