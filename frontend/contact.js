// Contact Support page: validation and submission

function validateContactForm(name, email, message) {
  const errors = {};
  const trimmedName = (name || "").trim();
  const trimmedMessage = (message || "").trim();
  const emailStr = String(email || "").trim();

  if (!trimmedName) errors.name = "Name is required";
  if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) errors.email = "Valid email is required";
  if (!trimmedMessage) errors.message = "Message is required";
  if (trimmedName.length > 100) errors.name = "Name must be ≤ 100 characters";
  if (emailStr.length > 120) errors.email = "Email must be ≤ 120 characters";
  if (trimmedMessage.length > 5000) errors.message = "Message must be ≤ 5000 characters";

  return { valid: Object.keys(errors).length === 0, errors };
}

async function sendSupportMessage(name, email, message) {
  const res = await fetch(`${API_BASE_URL}/api/support/send_message`, {
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

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const statusDiv = document.getElementById("contactStatus");
  const successMsg = document.getElementById("successMsg");
  const sendBtn = document.getElementById("sendBtn");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    statusDiv.textContent = "";
    successMsg.style.display = "none";

    const name = form.name.value;
    const email = form.email.value;
    const message = form.message.value;

    const { valid, errors } = validateContactForm(name, email, message);
    if (!valid) {
      statusDiv.textContent = Object.values(errors).join(". ");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
      const out = await sendSupportMessage(name.trim(), email.trim(), message.trim());
      successMsg.textContent = out.message || "Message sent successfully!";
      successMsg.style.display = "block";
      form.reset();
    } catch (err) {
      statusDiv.textContent = "Error: " + (err.message || "Failed to send");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }
  });
});

// Expose functions for tests
if (typeof window !== "undefined") {
  window.validateContactForm = validateContactForm;
  window.sendSupportMessage = sendSupportMessage;
}