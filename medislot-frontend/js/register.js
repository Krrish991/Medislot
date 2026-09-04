/*
 * MediSlot Step 2 — Registration
 *
 * Actual backend endpoints used:
 * POST /api/auth/register
 * GET  /api/clinics
 *
 * RegisterRequest fields in the backend:
 * name, email, password, role
 * plus doctor-only: clinicId, specialization, qualification,
 * experienceYears, consultationFee.
 */

const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";

const registerForm = document.getElementById("registerForm");
const patientRole = document.getElementById("patientRole");
const doctorRole = document.getElementById("doctorRole");
const doctorFields = document.getElementById("doctorFields");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const securityQuestionInput = document.getElementById("securityQuestion");
const securityAnswerInput = document.getElementById("securityAnswer");

const clinicSelect = document.getElementById("clinicId");
const specializationInput = document.getElementById("specialization");
const qualificationInput = document.getElementById("qualification");
const experienceInput = document.getElementById("experienceYears");
const feeInput = document.getElementById("consultationFee");
const clinicStatus = document.getElementById("clinicStatus");

const togglePassword = document.getElementById("togglePassword");
const registerButton = document.getElementById("registerButton");
const buttonText = document.getElementById("buttonText");
const buttonSpinner = document.getElementById("buttonSpinner");
const messageBox = document.getElementById("messageBox");

function isDoctor() {
  return doctorRole.checked;
}

function showMessage(message, type = "danger") {
  messageBox.className = `alert alert-${type}`;
  messageBox.textContent = message;
}

function clearMessage() {
  messageBox.className = "alert d-none";
  messageBox.textContent = "";
}

function setLoading(isLoading) {
  registerButton.disabled = isLoading;
  buttonText.textContent = isLoading ? "Creating account..." : "Create account";
  buttonSpinner.classList.toggle("d-none", !isLoading);
}

function setInvalid(element, invalid) {
  element.classList.toggle("is-invalid", invalid);
}

function clearValidation() {
  document.querySelectorAll("#registerForm .is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });
}

function validatePasswordRules(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
}

function updatePasswordRuleUI() {
  const rules = validatePasswordRules(passwordInput.value);

  Object.entries(rules).forEach(([rule, valid]) => {
    const el = document.querySelector(`[data-rule="${rule}"]`);
    if (el) el.classList.toggle("valid", valid);
  });
}

function validateForm() {
  clearValidation();
  let valid = true;

  if (!nameInput.value.trim()) {
    setInvalid(nameInput, true);
    valid = false;
  }

  if (!emailInput.value.trim() || !emailInput.validity.valid) {
    setInvalid(emailInput, true);
    valid = false;
  }

  // Frontend password policy is intentionally stronger than the backend's
  // @NotBlank check, so users get useful feedback before the API call.
  const passwordRules = validatePasswordRules(passwordInput.value);
  const passwordValid = Object.values(passwordRules).every(Boolean);

  if (!passwordValid) {
    setInvalid(passwordInput, true);
    document.getElementById("passwordFeedback").textContent =
      "Use at least 8 characters with uppercase, lowercase, number and special character.";
    valid = false;
  }

  if (!confirmPasswordInput.value || confirmPasswordInput.value !== passwordInput.value) {
    setInvalid(confirmPasswordInput, true);
    valid = false;
  }

  if (!securityQuestionInput.value) {
    setInvalid(securityQuestionInput, true);
    valid = false;
  }

  if (!securityAnswerInput.value.trim()) {
    setInvalid(securityAnswerInput, true);
    valid = false;
  }

  if (isDoctor()) {
    if (!clinicSelect.value) {
      setInvalid(clinicSelect, true);
      valid = false;
    }

    if (!specializationInput.value.trim()) {
      setInvalid(specializationInput, true);
      valid = false;
    }

    if (experienceInput.value !== "") {
      const exp = Number(experienceInput.value);
      if (!Number.isInteger(exp) || exp < 0 || exp > 80) {
        setInvalid(experienceInput, true);
        valid = false;
      }
    }

    if (feeInput.value !== "") {
      const fee = Number(feeInput.value);
      if (!Number.isFinite(fee) || fee < 0) {
        setInvalid(feeInput, true);
        valid = false;
      }
    }
  }

  return valid;
}

function toggleDoctorFields() {
  const doctor = isDoctor();

  doctorFields.classList.toggle("d-none", !doctor);

  // Doctor-only backend fields are required only when DOCTOR is selected.
  clinicSelect.required = doctor;
  specializationInput.required = doctor;

  if (doctor) {
    loadClinics();
  } else {
    setInvalid(clinicSelect, false);
    setInvalid(specializationInput, false);
  }
}

async function loadClinics() {
  clinicSelect.disabled = true;
  clinicStatus.textContent = "Loading clinics from backend...";
  clinicSelect.innerHTML = '<option value="">Loading clinics...</option>';

  try {
    const response = await fetch(`${API_BASE_URL}/api/clinics`);

    if (!response.ok) {
      throw new Error(`Clinic API returned ${response.status}`);
    }

    const clinics = await response.json();

    clinicSelect.innerHTML = '<option value="">Select a clinic</option>';

    if (!Array.isArray(clinics) || clinics.length === 0) {
      clinicSelect.innerHTML = '<option value="">No clinics available</option>';
      clinicStatus.textContent =
        "No clinic is available. An administrator must add a clinic before a doctor can register.";
      return;
    }

    clinics.forEach((clinic) => {
      const option = document.createElement("option");
      option.value = clinic.id;

      const location = [clinic.address, clinic.city].filter(Boolean).join(", ");
      option.textContent = location
        ? `${clinic.name} — ${location}`
        : (clinic.name || `Clinic #${clinic.id}`);

      clinicSelect.appendChild(option);
    });

    clinicStatus.textContent = `${clinics.length} clinic(s) loaded from MediSlot backend.`;
  } catch (error) {
    console.error("Clinic loading error:", error);
    clinicSelect.innerHTML = '<option value="">Unable to load clinics</option>';
    clinicStatus.textContent =
      "Could not connect to the backend. Make sure Spring Boot is running on port 8080.";
  } finally {
    clinicSelect.disabled = false;
  }
}

function buildPayload() {
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    role: document.querySelector('input[name="role"]:checked').value,
    securityQuestion: securityQuestionInput.value,
    securityAnswer: securityAnswerInput.value.trim()
  };

  if (isDoctor()) {
    payload.clinicId = Number(clinicSelect.value);
    payload.specialization = specializationInput.value.trim();

    if (qualificationInput.value.trim()) {
      payload.qualification = qualificationInput.value.trim();
    }

    if (experienceInput.value !== "") {
      payload.experienceYears = Number(experienceInput.value);
    }

    if (feeInput.value !== "") {
      payload.consultationFee = Number(feeInput.value);
    }
  }

  return payload;
}

patientRole.addEventListener("change", toggleDoctorFields);
doctorRole.addEventListener("change", toggleDoctorFields);

togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  togglePassword.textContent = showing ? "Show" : "Hide";
  togglePassword.setAttribute("aria-label", showing ? "Show password" : "Hide password");
});

passwordInput.addEventListener("input", () => {
  updatePasswordRuleUI();
  if (passwordInput.classList.contains("is-invalid")) {
    const rules = validatePasswordRules(passwordInput.value);
    if (Object.values(rules).every(Boolean)) {
      setInvalid(passwordInput, false);
    }
  }
});

confirmPasswordInput.addEventListener("input", () => {
  if (confirmPasswordInput.value === passwordInput.value && confirmPasswordInput.value) {
    setInvalid(confirmPasswordInput, false);
  }
});

securityQuestionInput.addEventListener("change", () => {
  if (securityQuestionInput.value) setInvalid(securityQuestionInput, false);
});

securityAnswerInput.addEventListener("input", () => {
  if (securityAnswerInput.value.trim()) setInvalid(securityAnswerInput, false);
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm()) {
    showMessage("Please correct the highlighted fields and try again.", "warning");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildPayload())
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      const backendMessage =
        data && typeof data.message === "string"
          ? data.message
          : "Registration failed. Please check your details.";

      showMessage(backendMessage, "danger");
      return;
    }

    // Backend returns the created account together with its role-specific ID.
    sessionStorage.setItem("medislotRegisteredUser", JSON.stringify(data));

    const generatedId = isDoctor() ? data.doctorId : data.patientId;
    const idLabel = isDoctor() ? "Doctor ID" : "Patient ID";

    if (!generatedId) {
      showMessage("Account was created, but the role-specific ID could not be generated. Please contact the administrator.", "warning");
      return;
    }

    if (isDoctor()) {
      showMessage(
        `Doctor account created successfully. Your Doctor ID is ${generatedId}. Please save this ID. Your account is pending administrator verification. Redirecting to login...`,
        "success"
      );
    } else {
      showMessage(
        `Patient account created successfully. Your Patient ID is ${generatedId}. Please save this ID. Redirecting to login...`,
        "success"
      );
    }

    registerForm.reset();
    patientRole.checked = true;
    toggleDoctorFields();
    updatePasswordRuleUI();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

  } catch (error) {
    console.error("MediSlot registration error:", error);
    showMessage(
      "Cannot connect to MediSlot backend. Make sure Spring Boot is running on port 8080.",
      "danger"
    );
  } finally {
    setLoading(false);
  }
});

toggleDoctorFields();
updatePasswordRuleUI();
