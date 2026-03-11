const express = require("express");
const sql = require("mssql");
const app = express();

// Configuración desde variables de ambiente
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Endpoint para leer Inventarios PAL3
app.get("/inventarios/pal3", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT MATNR, WERKS, LGORT
      FROM Inventarios
      WHERE LGORT IN ('P101', 'P102', 'P103')
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Endpoint para leer Inventarios PAL4
app.get("/inventarios/pal4", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT MATNR, WERKS, LGORT
      FROM Inventarios
      WHERE LGORT IN ('P009', 'P019', 'P001')
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => {
  console.log("API Invemtarios corriendo en puerto 3000");
});
