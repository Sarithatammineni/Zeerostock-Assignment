# Zeerostock — Assignment A: Inventory Search API + UI

## Quick Start

```bash
cd backend-a
npm install
npm start          
npm test          
```

Open `frontend/index.html` directly in a browser (no build step required).

---

## API Reference

### `GET /search`

| Param       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `q`         | string | Partial, case-insensitive name match |
| `category`  | string | Exact category (case-insensitive)    |
| `minPrice`  | number | Minimum price (inclusive)            |
| `maxPrice`  | number | Maximum price (inclusive)            |

**Example**
```
GET /search?q=copper&category=electrical&minPrice=500&maxPrice=5000
```

**Response**
```json
{
  "count": 1,
  "results": [
    { "id": 2, "name": "Copper Wire Coil 2.5mm", "category": "Electrical", "price": 1200, "quantity": 80 }
  ]
}
```

### `GET /categories`
Returns a sorted list of all unique category strings.

---

## Search Logic

Filters are applied sequentially on the in-memory array:

1. **Name filter** — `String.prototype.includes()` after lowercasing both the query and every `item.name`. This gives partial, case-insensitive matching in O(n) time.
2. **Category filter** — strict equality after lowercasing both sides.
3. **minPrice / maxPrice** — standard numeric comparisons.

All filters are combined with AND semantics. Missing or empty params are skipped so callers can use any subset.

**Edge cases handled:**
- Empty / whitespace-only `q` → treated as "no name filter"
- Non-numeric price → `400 Bad Request`
- `minPrice > maxPrice` → `400 Bad Request`
- No matches → `200 OK` with `{ "count": 0, "results": [] }`

---

## Performance Improvement for Large Datasets

**Current approach** is a linear scan (O(n)) — fine for hundreds of records, but it degrades at scale.

**Recommended improvement: inverted index + B-tree index**

Move the data to SQLite (or PostgreSQL) and add:

```sql
-- Full-text search on product_name
CREATE VIRTUAL TABLE inventory_fts USING fts5(name, content='inventory', content_rowid='id');

-- B-tree index for price range queries
CREATE INDEX idx_price ON inventory(price);

-- Covering index for combined category + price filter
CREATE INDEX idx_cat_price ON inventory(category, price);
```

This reduces name-match queries from O(n) string scan to O(log n + k) FTS lookup, and price-range filters become index seeks instead of full scans — critical once inventory reaches tens of thousands of rows.
