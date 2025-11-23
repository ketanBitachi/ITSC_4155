const fs = require("fs");
const path = require("path");

function loadPage(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
}

describe("contact.js", () => {
  beforeEach(() => {
    loadPage(path.join(process.cwd(), "contact.html"));
    require(path.join(process.cwd(), "contact.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
    fetch.mockReset();
  });

  test("validateContactForm flags empty fields", () => {
    const { valid, errors } = global.validateContactForm("", "", "");
    expect(valid).toBe(false);
    expect(errors.name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.message).toBeDefined();
  });

  test("sendSupportMessage posts to API and returns success", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: "Message sent successfully!" }) });
    const out = await global.sendSupportMessage("A", "a@b.com", "Hello");
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/support/send_message`,
      expect.objectContaining({ method: "POST" })
    );
    expect(out.message).toMatch(/success/i);
  });

  test("form submit shows success message", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: "Message sent successfully!" }) });
    const form = document.getElementById("contactForm");
    form.name.value = "Archita";
    form.email.value = "a@b.com";
    form.message.value = "Hi there";

    form.dispatchEvent(new Event("submit"));

    // allow async handler to run
    await Promise.resolve();
    await Promise.resolve();

    expect(document.getElementById("successMsg").style.display).toBe("block");
    expect(document.getElementById("successMsg").textContent).toMatch(/successfully/);
  });
});