/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("chemcalc.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_equations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    equation TEXT NOT NULL,
    balanced_equation TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/equations", (req, res) => {
    try {
      const equations = db.prepare("SELECT * FROM saved_equations ORDER BY created_at DESC").all();
      res.json(equations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equations" });
    }
  });

  app.post("/api/equations", (req, res) => {
    const { name, equation, balanced_equation } = req.body;
    if (!name || !equation || !balanced_equation) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare(
        "INSERT INTO saved_equations (name, equation, balanced_equation) VALUES (?, ?, ?)"
      ).run(name, equation, balanced_equation);
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to save equation" });
    }
  });

  app.delete("/api/equations/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM saved_equations WHERE id = ?").run(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
