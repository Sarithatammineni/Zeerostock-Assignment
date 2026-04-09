const express = require("express");
const cors = require("cors");
const inventory = require("./data");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


app.get("/search", (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  
  const min = minPrice !== undefined ? parseFloat(minPrice) : null;
  const max = maxPrice !== undefined ? parseFloat(maxPrice) : null;

  if (min !== null && isNaN(min)) {
    return res.status(400).json({ error: "minPrice must be a valid number." });
  }
  if (max !== null && isNaN(max)) {
    return res.status(400).json({ error: "maxPrice must be a valid number." });
  }
  if (min !== null && max !== null && min > max) {
    return res.status(400).json({ error: "minPrice cannot be greater than maxPrice." });
  }

  let results = inventory;

  if (q && q.trim() !== "") {
    const term = q.trim().toLowerCase();
    results = results.filter((item) =>
      item.name.toLowerCase().includes(term)
    );
  }

 
  if (category && category.trim() !== "") {
    const cat = category.trim().toLowerCase();
    results = results.filter((item) =>
      item.category.toLowerCase() === cat
    );
  }

  if (min !== null) {
    results = results.filter((item) => item.price >= min);
  }

 
  if (max !== null) {
    results = results.filter((item) => item.price <= max);
  }

  return res.json({
    count: results.length,
    results,
  });
});

app.get("/categories", (req, res) => {
  const cats = [...new Set(inventory.map((i) => i.category))].sort();
  res.json(cats);
});

app.listen(PORT, () =>
  console.log(`Assignment A server running on http://localhost:${PORT}`)
);

module.exports = app; 
