# Zeerostock — Assignment B: Inventory Database + APIs

## Quick Start

```bash
cd backend-b
npm install
node seed.js       # populate sample data
npm start          # → http://localhost:3002
npm test           # runs 11 Jest/Supertest tests
```

---

## API Reference

### `POST /supplier`
```json
{ "name": "Apex Metals Pvt Ltd", "city": "Mumbai" }
```
Returns the created supplier with its generated `id`.

### `POST /inventory`
```json
{
  "supplier_id": 1,
  "product_name": "Steel I-Beam 150x75",
  "quantity": 25,
  "price": 4800
}
```
Validates that `supplier_id` exists, `quantity >= 0`, and `price > 0`.

### `GET /inventory`
Returns all inventory rows joined with supplier info.  
Optional filter: `?supplier_id=1`

### `GET /inventory/grouped` ← Required Query
Returns every supplier with its inventory items, **sorted descending by total inventory value** (`SUM(quantity × price)`).

```json
{
  "count": 3,
  "results": [
    {
      "supplier_id": 2,
      "supplier_name": "PrimeTech Electricals",
      "supplier_city": "Pune",
      "item_count": 4,
      "total_quantity": 332,
      "total_inventory_value": 299600,
      "items": [ ... ]
    }
  ]
}
```

### `GET /suppliers`
Lists all suppliers ordered by name.

---

## Database Schema

```
suppliers
  id        INTEGER  PK  AUTOINCREMENT
  name      TEXT     NOT NULL
  city      TEXT     NOT NULL

inventory
  id            INTEGER  PK  AUTOINCREMENT
  supplier_id   INTEGER  NOT NULL  → suppliers(id)
  product_name  TEXT     NOT NULL
  quantity      INTEGER  NOT NULL  CHECK >= 0
  price         REAL     NOT NULL  CHECK > 0
  created_at    TEXT     DEFAULT datetime('now')
```

**Relationship:** One supplier → many inventory items (1:N enforced via foreign key).

---

## Why SQL (SQLite)?

| Concern                    | Reasoning                                                                                                     |
|----------------------------|---------------------------------------------------------------------------------------------------------------|
| **Structured data**        | Suppliers and inventory have fixed, well-defined schemas with a clear relational link.                        |
| **Referential integrity**  | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id)` is enforced at the DB level, not just in app code.       |
| **Aggregation query**      | `SUM(quantity * price) GROUP BY supplier_id ORDER BY total DESC` is natural, declarative SQL.                 |
| **ACID guarantees**        | Quantity updates (e.g. a buyer reservation) need atomic, consistent writes — SQL gives this for free.         |
| **Simplicity**             | No schema migration tool needed for this scope; a single `.db` file is easy to ship and test.                 |

A document store (MongoDB) would add flexibility but complicate the grouped-value aggregation and referential integrity checks.

---

## Indexing & Optimization

Two indexes are created at startup:

```sql
-- Fast lookup of all inventory belonging to a supplier
CREATE INDEX idx_inventory_supplier ON inventory(supplier_id);

-- Covering index for the grouped-value query
-- The DB engine can satisfy SUM(quantity * price) from this index alone
-- without touching the main table pages.
CREATE INDEX idx_inventory_value ON inventory(supplier_id, quantity, price);
```

**For production scale**, the next step would be a **materialized/summary table**:

```sql
CREATE TABLE supplier_value_cache (
  supplier_id   INTEGER PRIMARY KEY,
  total_value   REAL,
  updated_at    TEXT
);
```

Update it via a trigger on every `INSERT/UPDATE/DELETE` to `inventory`. The `/inventory/grouped` endpoint then reads from this O(1) cache instead of re-aggregating on every request — essential when a supplier has thousands of SKUs.
