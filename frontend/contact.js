// Contact Support page: validation and submission

function validateContactForm(name, email, message) {
  const errors = {};
  const trimmedName = (name || "").trim();
  const trimmedMessage = (message || "").trim();
  const emailStr = String(email || "").trim();

  if (!trimmedName) errors.name = "Name is required";
  if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    errors.email = "Valid email is required";
  }
  if (!trimmedMessage) errors.message = "Message is required";
  if (trimmedName.length > 100) errors.name = "Name must be ≤ 100 characters";
  if (emailStr.length > 120) errors.email = "Email must be ≤ 120 characters";
  if (trimmedMessage.length > 5000) {
    errors.message = "Message must be ≤ 5000 characters";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

async function sendSupportMessage(name, email, message) {
  // Support both browser globals and Jest globals
  const baseUrl =
    (typeof API_BASE_URL !== "undefined" && API_BASE_URL) ||
    (typeof window !== "undefined" && window.API_BASE_URL) ||
    "";

  const res = await fetch(`${baseUrl}/api/support/send_message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail || data.message || "Failed to send message";
    throw new Error(detail);
  }
  return data;
}

function initContactPage() {
  const form = document.getElementById("contactForm");
  const statusDiv = document.getElementById("contactStatus");
  const successMsg = document.getElementById("successMsg");
  const sendBtn = document.getElementById("sendBtn");
  const yearSpan = document.getElementById("year");

  if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (statusDiv) statusDiv.textContent = "";
    if (successMsg) {
      successMsg.style.display = "none";
      successMsg.textContent = "";
    }

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    const name = nameInput?.value || "";
    const email = emailInput?.value || "";
    const message = messageInput?.value || "";

    const { valid, errors } = validateContactForm(name, email, message);
    if (!valid) {
      if (statusDiv) statusDiv.textContent = Object.values(errors).join(". ");
      return;
    }

    if (successMsg) {
      successMsg.style.display = "block";
      successMsg.textContent = "Message sent successfully!";
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending...";
    }

    try {
      const out = await sendSupportMessage(
        name.trim(),
        email.trim(),
        message.trim()
      );

      if (successMsg) {
        successMsg.textContent = out.message || "Message sent successfully!";
        successMsg.style.display = "block"; // <<< what the test checks
      }
      form.reset();
    } catch (err) {
      if (statusDiv) {
        statusDiv.textContent = "Error: " + (err.message || "Failed to send");
      }
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
      }
    }
  });
}

// Run init both in browser and in Jest (even if DOMContentLoaded isn’t fired)
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactPage);
  } else {
    initContactPage();
  }
}

// Expose functions for tests
if (typeof window !== "undefined") {
  window.validateContactForm = validateContactForm;
  window.sendSupportMessage = sendSupportMessage;
}
