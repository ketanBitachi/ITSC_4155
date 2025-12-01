// tests/auth.test.js
const path = require("path");

describe("auth.js", () => {
  beforeAll(() => {
    require(path.join(process.cwd(), "auth.js"));
  });

  beforeEach(() => {
    fetch.mockReset();
    localStorage.clear();
  });

  test("getAuthHeaders returns Bearer token", () => {
    localStorage.setItem("authToken", "abc123");
    expect(global.getAuthHeaders()).toEqual({
      Authorization: "Bearer abc123",
      "Content-Type": "application/json"
    });
  });

  test("checkAuthStatus removes expired token and redirects to login (not on index/login)", () => {
    localStorage.setItem("authToken", "tkn");
    const past = new Date(Date.now() - 60_000).toISOString();
    localStorage.setItem("tokenExpiry", past);
    location.href = "http://localhost/ingredients.html";

    const result = global.checkAuthStatus();
    expect(result).toBe(false);
    expect(localStorage.getItem("authToken")).toBe(null);
    expect(location.href.endsWith("login.html")).toBe(true);
  });

  test("checkAuthStatus true when valid", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    localStorage.setItem("authToken", "tkn");
    localStorage.setItem("tokenExpiry", future);
    location.href = "http://localhost/ingredients.html";

    expect(global.checkAuthStatus()).toBe(true);
  });

  test("registerUser success", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 })
    });

    const out = await global.registerUser("archita", "a@b.com", "pw");

    expect(fetch).toHaveBeenCalledWith(
      `${global.API_BASE_URL}/api/register`,
      expect.objectContaining({ method: "POST" })
    );
    expect(out.success).toBe(true);
  });

  test("loginUser stores token + expiry and returns username", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "xyz", username: "archita" })
    });

    const res = await global.loginUser("a@b.com", "pw");
    expect(res.success).toBe(true);
    expect(localStorage.getItem("authToken")).toBe("xyz");
    expect(localStorage.getItem("tokenExpiry")).not.toBeNull();
  });

  test("logoutUser clears and redirects", () => {
    localStorage.setItem("authToken", "x");
    localStorage.setItem("tokenExpiry", "y");
    location.href = "http://localhost/ingredients.html";

    global.logoutUser();

    expect(localStorage.getItem("authToken")).toBeNull();
    expect(location.href.endsWith("login.html")).toBe(true);
  });
});