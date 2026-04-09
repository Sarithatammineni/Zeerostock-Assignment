const express = require("express");
const cors = require("cors");
const { getDb, query, run } = require("./db");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try { await getDb(); next(); }
  catch (err) { res.status(500).json({ error: "Database initialisation failed." }); }
});

app.get("/healthz", (req, res) => res.json({ status: "ok" }));


app.post("/supplier", (req, res) => {
  const { name, city } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "")
    return res.status(400).json({ error: "name is required and must be a non-empty string." });
  if (!city || typeof city !== "string" || city.trim() === "")
    return res.status(400).json({ error: "city is required and must be a non-empty string." });
  const { lastInsertRowid } = run("INSERT INTO suppliers (name, city) VALUES (?, ?)", [name.trim(), city.trim()]);
  const [supplier] = query("SELECT * FROM suppliers WHERE id = ?", [lastInsertRowid]);
  return res.status(201).json(supplier);
});


app.post("/inventory", (req, res) => {
  const { supplier_id, product_name, quantity, price } = req.body;
  if (!supplier_id || isNaN(Number(supplier_id)))
    return res.status(400).json({ error: "supplier_id must be a valid number." });
  if (!product_name || typeof product_name !== "string" || product_name.trim() === "")
    return res.status(400).json({ error: "product_name is required." });
  if (quantity === undefined || quantity === null || isNaN(Number(quantity)))
    return res.status(400).json({ error: "quantity must be a valid number." });
  if (Number(quantity) < 0)
    return res.status(400).json({ error: "quantity must be >= 0." });
  if (!price || isNaN(Number(price)))
    return res.status(400).json({ error: "price must be a valid number." });
  if (Number(price) <= 0)
    return res.status(400).json({ error: "price must be > 0." });
  const suppliers = query("SELECT id FROM suppliers WHERE id = ?", [Number(supplier_id)]);
  if (suppliers.length === 0)
    return res.status(404).json({ error: `Supplier with id ${supplier_id} does not exist.` });
  const { lastInsertRowid } = run(
    "INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)",
    [Number(supplier_id), product_name.trim(), Number(quantity), Number(price)]
  );
  const [item] = query("SELECT * FROM inventory WHERE id = ?", [lastInsertRowid]);
  return res.status(201).json(item);
});


app.get("/inventory", (req, res) => {
  const { supplier_id } = req.query;
  const sql = `SELECT i.id, i.product_name, i.quantity, i.price, i.created_at,
    s.id AS supplier_id, s.name AS supplier_name, s.city AS supplier_city
    FROM inventory i JOIN suppliers s ON s.id = i.supplier_id`;
  const rows = supplier_id
    ? query(sql + " WHERE i.supplier_id = ?", [Number(supplier_id)])
    : query(sql);
  return res.json({ count: rows.length, results: rows });
});


app.get("/inventory/grouped", (req, res) => {
  const suppliers = query("SELECT * FROM suppliers");
  const items = query("SELECT * FROM inventory");
  const grouped = suppliers.map((s) => {
    const supplierItems = items
      .filter((i) => i.supplier_id === s.id)
      .map((i) => ({ ...i, line_value: Math.round(i.quantity * i.price * 100) / 100 }));
    const total_inventory_value = Math.round(supplierItems.reduce((acc, i) => acc + i.line_value, 0) * 100) / 100;
    return {
      supplier_id: s.id, supplier_name: s.name, supplier_city: s.city,
      item_count: supplierItems.length,
      total_quantity: supplierItems.reduce((acc, i) => acc + i.quantity, 0),
      total_inventory_value, items: supplierItems,
    };
  });
  grouped.sort((a, b) => b.total_inventory_value - a.total_inventory_value);
  return res.json({ count: grouped.length, results: grouped });
});


app.get("/suppliers", (req, res) => {
  const suppliers = query("SELECT * FROM suppliers ORDER BY name");
  res.json({ count: suppliers.length, results: suppliers });
});

if (require.main === module) {
  const { seed } = require("./seed");
  seed()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`Assignment B server running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => {
      console.error("Startup seed failed:", err);
      process.exit(1);
    });
}

module.exports = app;
