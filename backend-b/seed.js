/**
 * Seed script – populates the database with sample suppliers and inventory.
 * Run with: node seed.js
 */
const { getDb, closeDb } = require("./db");

const db = getDb();

// Wipe existing data for a clean seed
db.exec("DELETE FROM inventory; DELETE FROM suppliers;");

const addSupplier = db.prepare("INSERT INTO suppliers (name, city) VALUES (?, ?)");
const addItem = db.prepare(
  "INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)"
);

const seed = db.transaction(() => {
  const a = addSupplier.run("Apex Metals Pvt Ltd",       "Mumbai").lastInsertRowid;
  const b = addSupplier.run("PrimeTech Electricals",     "Pune").lastInsertRowid;
  const c = addSupplier.run("SteelCraft Industries",     "Ahmedabad").lastInsertRowid;

  // Apex Metals
  addItem.run(a, "Steel I-Beam 150x75",       25,   4800);
  addItem.run(a, "Aluminum Angle Bar 40x40",  300,  280);
  addItem.run(a, "Stainless Hex Bolts M10",   5000, 18);

  // PrimeTech
  addItem.run(b, "Three Phase Motor 2.2kW",   12,   12500);
  addItem.run(b, "LED Panel Light 40W",        150,  650);
  addItem.run(b, "Cable Tray 100mm Galv",     90,   520);
  addItem.run(b, "Copper Wire Coil 2.5mm",    80,   1200);

  // SteelCraft
  addItem.run(c, "Hydraulic Hose Assembly",   30,   3200);
  addItem.run(c, "Polycarbonate Sheet 6mm",   60,   1850);
  addItem.run(c, "HDPE Pipes 50mm",           200,  450);
});

seed();
closeDb();
console.log("Database seeded successfully.");
