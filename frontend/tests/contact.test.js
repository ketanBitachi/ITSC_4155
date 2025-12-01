// tests/contact.test.js
const fs = require("fs");
const path = require("path");

function loadPage(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
}

describe("contact.js", () => {
  beforeEach(() => {
    // load the contact.html page into jsdom
    loadPage(path.join(process.cwd(), "contact.html"));

    // require config + contact logic
    require(path.join(process.cwd(), "config.js"));
    require(path.join(process.cwd(), "contact.js"));

    // trigger DOMContentLoaded listeners
    document.dispatchEvent(new Event("DOMContentLoaded"));
  });

  test("form submit shows success message", async () => {
    const form = document.getElementById("contactForm");

    // grab fields explicitly instead of relying on form.email, etc.
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    nameInput.value = "Archita";
    emailInput.value = "a@b.com";
    messageInput.value = "Hi there";

    // mock fetch to simulate successful backend call
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ message: "Message sent successfully!" })
    }));

    form.dispatchEvent(new Event("submit"));

    // let async handlers run
    await Promise.resolve();

    const success = document.getElementById("successMsg");
    expect(success.style.display).toBe("block");
    expect(success.textContent).toMatch(/successfully/);
  });
});
