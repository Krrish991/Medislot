const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";

const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");
const emailInput = document.getElementById("email");
const questionBox = document.getElementById("securityQuestion");
const securityAnswerInput = document.getElementById("securityAnswer");
const newPasswordInput = document.getElementById("newPassword");
const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
const messageBox = document.getElementById("messageBox");
const findButton = document.getElementById("findQuestionButton");
const findButtonText = document.getElementById("findButtonText");
const resetButton = document.getElementById("resetButton");

let verifiedEmail = "";

function showMessage(message, type = "danger") {
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = message;
}

function clearMessage() {
  messageBox.className = "alert d-none";
  messageBox.textContent = "";
}

function passwordIsStrong(password) {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

forgotForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!emailInput.value.trim() || !emailInput.validity.valid) {
    emailInput.classList.add("is-invalid");
    return;
  }

  emailInput.classList.remove("is-invalid");
  findButton.disabled = true;
  findButtonText.textContent = "Loading...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value.trim() })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Could not find this account.", "danger");
      return;
    }

    verifiedEmail = emailInput.value.trim();
    questionBox.textContent = data.securityQuestion;
    forgotForm.classList.add("d-none");
    resetForm.classList.remove("d-none");
    showMessage("Security question found. Enter the correct answer and your new password.", "info");
  } catch (error) {
    console.error("Forgot password error:", error);
    showMessage("Cannot connect to MediSlot backend. Make sure Spring Boot is running on port 8080.", "danger");
  } finally {
    findButton.disabled = false;
    findButtonText.textContent = "Continue";
  }
});

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  let valid = true;
  if (!securityAnswerInput.value.trim()) {
    securityAnswerInput.classList.add("is-invalid");
    valid = false;
  } else {
    securityAnswerInput.classList.remove("is-invalid");
  }

  if (!passwordIsStrong(newPasswordInput.value)) {
    newPasswordInput.classList.add("is-invalid");
    valid = false;
  } else {
    newPasswordInput.classList.remove("is-invalid");
  }

  if (!confirmNewPasswordInput.value || confirmNewPasswordInput.value !== newPasswordInput.value) {
    confirmNewPasswordInput.classList.add("is-invalid");
    valid = false;
  } else {
    confirmNewPasswordInput.classList.remove("is-invalid");
  }

  if (!valid) {
    showMessage("Please correct the highlighted fields.", "warning");
    return;
  }

  resetButton.disabled = true;
  resetButton.textContent = "Updating password...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: verifiedEmail,
        securityAnswer: securityAnswerInput.value.trim(),
        newPassword: newPasswordInput.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Password reset failed.", "danger");
      return;
    }

    showMessage("Password updated successfully. Redirecting to login...", "success");
    resetForm.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  } catch (error) {
    console.error("Reset password error:", error);
    showMessage("Cannot connect to MediSlot backend. Make sure Spring Boot is running on port 8080.", "danger");
  } finally {
    resetButton.disabled = false;
    resetButton.textContent = "Update password";
  }
});
