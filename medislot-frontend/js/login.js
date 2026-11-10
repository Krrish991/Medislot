

const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const buttonText = document.getElementById("buttonText");
const buttonSpinner = document.getElementById("buttonSpinner");
const messageBox = document.getElementById("messageBox");
const togglePassword = document.getElementById("togglePassword");

function showMessage(message, type = "danger") {
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = message;
}

function clearMessage() {
  messageBox.className = "alert d-none";
  messageBox.textContent = "";
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;
  buttonText.textContent = isLoading ? "Signing in..." : "Login";
  buttonSpinner.classList.toggle("d-none", !isLoading);
}

function completeLogin(data) {
  // Backend returns user data plus the patient's/doctor's actual database ID.
  sessionStorage.setItem("medislotUser", JSON.stringify(data));
  sessionStorage.removeItem("medislotPatientId");
  sessionStorage.removeItem("medislotDoctorId");

  const role = String(data.role || "").toUpperCase();
  if (role === "PATIENT" && data.patientId) {
    sessionStorage.setItem("medislotPatientId", String(data.patientId));
  }
  if (role === "DOCTOR" && data.doctorId) {
    sessionStorage.setItem("medislotDoctorId", String(data.doctorId));
  }

  const accountId = role === "PATIENT" ? data.patientId : role === "DOCTOR" ? data.doctorId : data.userId;
  const idText = accountId ? ` Your ${role === "PATIENT" ? "Patient" : role === "DOCTOR" ? "Doctor" : "User"} ID is ${accountId}.` : "";
  showMessage(`Login successful. Welcome, ${data.name || "User"}!${idText}`, "success");

  /*
   * Dashboard pages will be added step-by-step.
   * For now, keep the login page stable and show the detected role.
   */
  setTimeout(() => {
    if (role === "PATIENT") {
      window.location.href = "patient-dashboard.html";
    } else if (role === "DOCTOR") {
      window.location.href = "doctor-dashboard.html";
    } else if (role === "ADMIN") {
      window.location.href = "admin-dashboard.html";
    } else {
      showMessage("Login succeeded, but the account role is not recognized.", "warning");
    }
  }, 500);
}

function validateForm() {
  let valid = true;

  if (!emailInput.value.trim() || !emailInput.validity.valid) {
    emailInput.classList.add("is-invalid");
    valid = false;
  } else {
    emailInput.classList.remove("is-invalid");
  }

  if (!passwordInput.value) {
    passwordInput.classList.add("is-invalid");
    valid = false;
  } else {
    passwordInput.classList.remove("is-invalid");
  }

  return valid;
}

emailInput.addEventListener("input", () => {
  if (emailInput.value.trim() && emailInput.validity.valid) {
    emailInput.classList.remove("is-invalid");
  }
});

passwordInput.addEventListener("input", () => {
  if (passwordInput.value) {
    passwordInput.classList.remove("is-invalid");
  }
});

togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  togglePassword.textContent = showing ? "Show" : "Hide";
  togglePassword.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  togglePassword.setAttribute("title", showing ? "Show password" : "Hide password");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm()) {
    showMessage("Please enter your email and password.", "warning");
    return;
  }

  setLoading(true);

  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      if (data && data.message === "EMAIL_NOT_VERIFIED") {
        window.location.href = "verify-email.html?email=" + encodeURIComponent(payload.email);
        return;
      }
      const backendMessage =
        data && typeof data.message === "string"
          ? data.message
          : "Login failed. Please check your email and password.";

      showMessage(backendMessage, "danger");
      return;
    }

    completeLogin(data);

  } catch (error) {
    console.error("MediSlot login error:", error);
    showMessage(
      "Cannot connect to MediSlot backend. Make sure Spring Boot is running on port 8080.",
      "danger"
    );
  } finally {
    setLoading(false);
  }
});

const GOOGLE_CLIENT_ID = "633465237171-fkdv91r4t1mrfl8f4psni75a9f5433hm.apps.googleusercontent.com";
window.addEventListener("load", () => {
  if (!window.google) return;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });
  google.accounts.id.renderButton(document.getElementById("googleBtn"),
    { theme: "outline", size: "large", width: 320, text: "continue_with" });
});

async function onGoogleCredential(resp) {
  clearMessage();
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: resp.credential })
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      showMessage(data?.message || "Google sign-in failed.", "danger");
      return;
    }
    completeLogin(data);
  } catch (error) {
    showMessage("Cannot connect to MediSlot backend.", "danger");
  }
}
