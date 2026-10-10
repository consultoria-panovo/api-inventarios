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

// Configuración por centro: código de centro (WERKS) y sus almacenes (LGORT)
const CENTROS = {
  pal3: { werks: "PAL3", almacenes: ["P101", "P102", "P104", "P105", "P107"] },
  pal4: { werks: "PAL4", almacenes: ["P009", "P019", "P001", "PJC1"] }
};

// Reutilizamos la conexión (pool) en lugar de reconectar en cada request
const poolPromise = sql.connect(config);

async function getInventario(centro) {
  const pool = await poolPromise;
  const request = pool.request();

  // Parámetros para evitar SQL injection y mantener el query limpio
  request.input("werks", sql.VarChar, centro.werks);
  const placeholders = centro.almacenes.map((alm, i) => {
    request.input(`lgort${i}`, sql.VarChar, alm);
    return `@lgort${i}`;
  });

  const result = await request.query(`
    WITH UltimosInventarios AS (
        SELECT 
            MATNR, 
            WERKS, 
            LGORT, 
            LABST, 
            FechaDeCreacion,
            ROW_NUMBER() OVER(
                PARTITION BY MATNR, WERKS, LGORT 
                ORDER BY FechaDeCreacion DESC
            ) AS rn
        FROM Inventarios
        WHERE WERKS = @werks
          AND LGORT IN (${placeholders.join(", ")})
    )
    SELECT 
        MATNR, 
        WERKS, 
        SUM(LABST) AS LABST_Total, 
        MAX(FechaDeCreacion) AS UltimaActualizacion
    FROM UltimosInventarios
    WHERE rn = 1
    GROUP BY MATNR, WERKS;
  `);

  return result.recordset;
}

// Endpoint PAL3
app.get("/inventarios/pal3", async (req, res) => {
  try {
    const data = await getInventario(CENTROS.pal3);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Endpoint PAL4
app.get("/inventarios/pal4", async (req, res) => {
  try {
    const data = await getInventario(CENTROS.pal4);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => {
  console.log("API Inventarios corriendo en puerto 3000 con filtro de centro y última fecha");
});
