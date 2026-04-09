process.env.DB_PATH = ":memory:";
const request = require("supertest");
const app = require("./server");
const { closeDb } = require("./db");

afterAll(() => closeDb());

describe("POST /supplier", () => {
  it("creates a supplier", async () => {
    const res = await request(app).post("/supplier").send({ name: "Test Corp", city: "Delhi" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Test Corp", city: "Delhi" });
    expect(res.body.id).toBeDefined();
  });
  it("rejects missing name", async () => {
    const res = await request(app).post("/supplier").send({ city: "Delhi" });
    expect(res.status).toBe(400);
  });
  it("rejects empty city", async () => {
    const res = await request(app).post("/supplier").send({ name: "X", city: "" });
    expect(res.status).toBe(400);
  });
});

describe("POST /inventory", () => {
  let supplierId;
  beforeAll(async () => {
    const res = await request(app).post("/supplier").send({ name: "Inv Supplier", city: "Chennai" });
    supplierId = res.body.id;
  });
  it("creates an inventory item", async () => {
    const res = await request(app).post("/inventory").send({ supplier_id: supplierId, product_name: "Widget", quantity: 100, price: 250 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ product_name: "Widget", quantity: 100, price: 250 });
  });
  it("allows quantity = 0", async () => {
    const res = await request(app).post("/inventory").send({ supplier_id: supplierId, product_name: "Empty", quantity: 0, price: 10 });
    expect(res.status).toBe(201);
  });
  it("rejects quantity < 0", async () => {
    const res = await request(app).post("/inventory").send({ supplier_id: supplierId, product_name: "Bad", quantity: -5, price: 10 });
    expect(res.status).toBe(400);
  });
  it("rejects price = 0", async () => {
    const res = await request(app).post("/inventory").send({ supplier_id: supplierId, product_name: "Free", quantity: 10, price: 0 });
    expect(res.status).toBe(400);
  });
  it("rejects non-existent supplier", async () => {
    const res = await request(app).post("/inventory").send({ supplier_id: 99999, product_name: "Ghost", quantity: 1, price: 1 });
    expect(res.status).toBe(404);
  });
});

describe("GET /inventory", () => {
  it("returns all inventory with supplier info", async () => {
    const res = await request(app).get("/inventory");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});

describe("GET /inventory/grouped", () => {
  it("returns suppliers sorted by total inventory value desc", async () => {
    const res = await request(app).get("/inventory/grouped");
    expect(res.status).toBe(200);
    const values = res.body.results.map((r) => r.total_inventory_value);
    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]);
    }
  });
  it("includes items array per supplier", async () => {
    const res = await request(app).get("/inventory/grouped");
    res.body.results.forEach((s) => expect(Array.isArray(s.items)).toBe(true));
  });
});
