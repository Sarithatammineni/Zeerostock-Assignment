const { getDb, query, run, closeDb } = require("./db");

async function seed() {
  await getDb(); 


  run("DELETE FROM inventory");
  run("DELETE FROM suppliers");


  const { lastInsertRowid: a } = run("INSERT INTO suppliers (name, city) VALUES (?, ?)", ["Apex Metals Pvt Ltd",   "Mumbai"]);
  const { lastInsertRowid: b } = run("INSERT INTO suppliers (name, city) VALUES (?, ?)", ["PrimeTech Electricals", "Pune"]);
  const { lastInsertRowid: c } = run("INSERT INTO suppliers (name, city) VALUES (?, ?)", ["SteelCraft Industries",  "Ahmedabad"]);

 
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [a, "Steel I-Beam 150x75",      25,   4800]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [a, "Aluminum Angle Bar 40x40", 300,    280]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [a, "Stainless Hex Bolts M10",  5000,    18]);

  
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [b, "Three Phase Motor 2.2kW",  12,  12500]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [b, "LED Panel Light 40W",      150,   650]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [b, "Cable Tray 100mm Galv",    90,    520]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [b, "Copper Wire Coil 2.5mm",   80,   1200]);


  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [c, "Hydraulic Hose Assembly",  30,   3200]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [c, "Polycarbonate Sheet 6mm",  60,   1850]);
  run("INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)", [c, "HDPE Pipes 50mm",          200,   450]);

  const [{ n }] = query("SELECT COUNT(*) AS n FROM inventory");
  console.log(`Seeded ${n} inventory items across 3 suppliers.`);
}

if (require.main === module) {
  seed()
    .then(() => { closeDb(); console.log("Seed complete."); })
    .catch((err) => { console.error("Seed failed:", err); process.exit(1); });
}

module.exports = { seed };
