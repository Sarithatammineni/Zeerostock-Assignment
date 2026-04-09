const request = require("supertest");
const app = require("./server");

describe("GET /search", () => {
  it("returns all results when no filters supplied", async () => {
    const res = await request(app).get("/search");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(15);
  });

  it("filters by partial product name (case-insensitive)", async () => {
    const res = await request(app).get("/search?q=copper");
    expect(res.status).toBe(200);
    expect(res.body.results.every((r) => r.name.toLowerCase().includes("copper"))).toBe(true);
  });

  it("filters by category (case-insensitive)", async () => {
    const res = await request(app).get("/search?category=electrical");
    expect(res.status).toBe(200);
    expect(res.body.results.every((r) => r.category.toLowerCase() === "electrical")).toBe(true);
  });

  it("filters by minPrice", async () => {
    const res = await request(app).get("/search?minPrice=1000");
    expect(res.body.results.every((r) => r.price >= 1000)).toBe(true);
  });

  it("filters by maxPrice", async () => {
    const res = await request(app).get("/search?maxPrice=100");
    expect(res.body.results.every((r) => r.price <= 100)).toBe(true);
  });

  it("combines multiple filters", async () => {
    const res = await request(app).get("/search?category=plumbing&maxPrice=100");
    expect(res.status).toBe(200);
    res.body.results.forEach((r) => {
      expect(r.category.toLowerCase()).toBe("plumbing");
      expect(r.price).toBeLessThanOrEqual(100);
    });
  });

  it("returns empty array for no matches", async () => {
    const res = await request(app).get("/search?q=xyznonexistent");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.results).toHaveLength(0);
  });

  it("returns 400 for invalid minPrice", async () => {
    const res = await request(app).get("/search?minPrice=abc");
    expect(res.status).toBe(400);
  });

  it("returns 400 when minPrice > maxPrice", async () => {
    const res = await request(app).get("/search?minPrice=5000&maxPrice=100");
    expect(res.status).toBe(400);
  });

  it("treats empty q as no name filter", async () => {
    const res = await request(app).get("/search?q=");
    expect(res.body.count).toBe(15);
  });
});
