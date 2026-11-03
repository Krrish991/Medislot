const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";

const email = new URLSearchParams(window.location.search).get("email");
if (!email) {
  window.location.href = "login.html";
} else {
  document.getElementById("emailText").textContent = email;
}

const verifyForm = document.getElementById("verifyForm");
const codeInput = document.getElementById("code");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const messageBox = document.getElementById("messageBox");

function showMessage(msg, type) {
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = msg;
}

async function post(path, body) {
  const response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  let data = {};
  try { data = await response.json(); } catch (_) { data = {}; }
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

verifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = codeInput.value.trim();
  if (!/^\d{6}$/.test(code)) {
    showMessage("Please enter a valid 6-digit code.", "warning");
    return;
  }
  verifyBtn.disabled = true;
  try {
    const data = await post("verify-email", { email, code });
    showMessage(data.message || "Email verified successfully", "success");
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
  } catch (error) {
    showMessage(error.message, "danger");
    verifyBtn.disabled = false;
  }
});

resendBtn.addEventListener("click", async () => {
  resendBtn.disabled = true;
  try {
    const data = await post("resend-code", { email });
    showMessage(data.message || "A new code has been sent", "success");
    let remaining = 60;
    resendBtn.textContent = `Resend code (${remaining}s)`;
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend code";
      } else {
        resendBtn.textContent = `Resend code (${remaining}s)`;
      }
    }, 1000);
  } catch (error) {
    showMessage(error.message, "danger");
    resendBtn.disabled = false;
  }
});
