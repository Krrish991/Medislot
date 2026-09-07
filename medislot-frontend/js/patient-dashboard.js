const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";

const userName = document.getElementById("userName");
const dashboardMessage = document.getElementById("dashboardMessage");
const doctorCount = document.getElementById("doctorCount");
const specializationInput = document.getElementById("specializationInput");
const specializationButton = document.getElementById("specializationButton");
const allDoctorsButton = document.getElementById("allDoctorsButton");
const symptomInput = document.getElementById("symptomInput");
const symptomButton = document.getElementById("symptomButton");
const symptomMatch = document.getElementById("symptomMatch");
const nearbyButton = document.getElementById("nearbyButton");
const nearbyButtonText = document.getElementById("nearbyButtonText");
const nearbySpinner = document.getElementById("nearbySpinner");
const nearbyResults = document.getElementById("nearbyResults");
const locationStatus = document.getElementById("locationStatus");
const mapPanel = document.getElementById("mapPanel");
const clinicMap = document.getElementById("clinicMap");
const mapSummary = document.getElementById("mapSummary");
const routeButton = document.getElementById("routeButton");
const doctorResults = document.getElementById("doctorResults");
const resultsTitle = document.getElementById("resultsTitle");
const resultsSubtitle = document.getElementById("resultsSubtitle");
const resultsCount = document.getElementById("resultsCount");
const appointmentResults = document.getElementById("appointmentResults");
const favoriteResults = document.getElementById("favoriteResults");

function getLoggedInUser() { try { return JSON.parse(sessionStorage.getItem("medislotUser") || "null"); } catch (_) { return null; } }
function getPatientId() { const value = sessionStorage.getItem("medislotPatientId"); return value ? Number(value) : null; }
function showMessage(message, type = "danger") { dashboardMessage.className = `alert alert-${type}`; dashboardMessage.textContent = message; }
function clearMessage() { dashboardMessage.className = "alert d-none"; dashboardMessage.textContent = ""; }
function initials(name) { return String(name || "Doctor").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(""); }
function money(value) { if (value === null || value === undefined || value === "") return "Fee not specified"; const n = Number(value); return Number.isFinite(n) ? `₹${n.toFixed(0)}` : "Fee not specified"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function doctorName(doctor) { return doctor?.user?.name || "Doctor"; }
function clinicText(doctor) { const c = doctor?.clinic; return c ? [c.name, c.city].filter(Boolean).join(" • ") : "Clinic information unavailable"; }
async function fetchJson(url, options = {}) { const r = await fetch(url, options); const d = await r.json().catch(() => null); if (!r.ok) throw new Error(d?.message || `Request failed with status ${r.status}`); return d; }

function renderDoctorCards(doctors, container) {
  container.innerHTML = "";
  if (!Array.isArray(doctors) || !doctors.length) { container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><strong>No doctors found.</strong></div>'; return; }
  doctors.forEach(item => {
    const doctor = item?.doctor || item;
    const availableToday = typeof item?.availableToday === "boolean" ? item.availableToday : null;
    const distance = item?.distanceKm;
    const card = document.createElement("article"); card.className = "doctor-card";
    card.innerHTML = `<div class="doctor-top"><div class="doctor-avatar">${escapeHtml(initials(doctorName(doctor)))}</div><div class="min-w-0"><h3 class="doctor-name">${escapeHtml(doctorName(doctor))}</h3><p class="doctor-specialization">${escapeHtml(doctor?.specialization || "Specialization not specified")}</p></div></div>
      <div class="doctor-meta"><div class="meta-row"><span class="meta-label">Qualification</span><span>${escapeHtml(doctor?.qualification || "—")}</span></div><div class="meta-row"><span class="meta-label">Experience</span><span>${doctor?.experienceYears ?? "—"} years</span></div><div class="meta-row"><span class="meta-label">Consultation</span><span>${money(doctor?.consultationFee)}</span></div><div class="meta-row"><span class="meta-label">Clinic</span><span class="text-end">${escapeHtml(clinicText(doctor))}</span></div></div>
      <div class="doctor-actions"><div class="d-flex gap-1 flex-wrap">${availableToday === null ? "" : `<span class="badge ${availableToday ? "text-bg-success" : "text-bg-secondary"}">${availableToday ? "Available Today" : "Not Today"}</span>`}${Number.isFinite(Number(distance)) && Number(distance) !== Number.MAX_VALUE ? `<span class="badge text-bg-light border">${Number(distance).toFixed(2)} km</span>` : ""}</div><button class="btn btn-outline-primary btn-sm profile-button" data-doctor-id="${escapeHtml(doctor?.id)}">View profile</button></div>`;
    container.appendChild(card);
  });
  container.querySelectorAll(".profile-button").forEach(b => b.onclick = () => { sessionStorage.setItem("medislotSelectedDoctorId", b.dataset.doctorId); location.href = "doctor-profile.html"; });
}

// Keeps the specialization resolved from the last successful symptom search so the
// "Nearby Doctor" action can stay scoped to that same medical need.
let activeSymptomSpecialization = sessionStorage.getItem("medislotSymptomSpecialization") || "";

function clearSymptomContext() {
  activeSymptomSpecialization = "";
  sessionStorage.removeItem("medislotSymptomSpecialization");
}

function setSymptomContext(specialization) {
  activeSymptomSpecialization = String(specialization || "").trim();
  if (activeSymptomSpecialization) sessionStorage.setItem("medislotSymptomSpecialization", activeSymptomSpecialization);
  else sessionStorage.removeItem("medislotSymptomSpecialization");
}

async function loadAllDoctors() { clearSymptomContext(); clearMessage(); resultsTitle.textContent = "Verified Doctors"; resultsSubtitle.textContent = "Browse doctors currently visible to patients."; resultsCount.textContent = "Loading..."; doctorResults.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Loading verified doctors...</div>'; try { const d = await fetchJson(`${API_BASE_URL}/api/doctors`); renderDoctorCards(d, doctorResults); resultsCount.textContent = `${Array.isArray(d) ? d.length : 0} doctors`; doctorCount.textContent = Array.isArray(d) ? d.length : 0; } catch(e) { showMessage(e.message); resultsCount.textContent = "0 doctors"; doctorResults.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><strong>Unable to load doctors.</strong></div>'; } }
async function searchSpecialization() { const s = specializationInput.value.trim(); if (!s) return loadAllDoctors(); clearSymptomContext(); clearMessage(); resultsTitle.textContent = `${s} Doctors`; resultsSubtitle.textContent = "Verified doctors matching the selected specialization."; doctorResults.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Searching...</div>'; try { const d = await fetchJson(`${API_BASE_URL}/api/doctors?spec=${encodeURIComponent(s)}`); renderDoctorCards(d, doctorResults); resultsCount.textContent = `${Array.isArray(d) ? d.length : 0} doctors`; doctorCount.textContent = Array.isArray(d) ? d.length : 0; } catch(e) { showMessage(e.message); } }
async function searchSymptom() { const s = symptomInput.value.trim(); if (!s) return showMessage("Please enter a symptom, such as fever or chest pain.", "warning"); clearMessage(); clearSymptomContext(); symptomMatch.className = "symptom-match"; symptomMatch.textContent = "Finding the related specialization..."; try { const d = await fetchJson(`${API_BASE_URL}/api/symptoms/search?q=${encodeURIComponent(s)}`); if (d?.matchedSpecialization) { setSymptomContext(d.matchedSpecialization); symptomMatch.innerHTML = `Symptom <strong>${escapeHtml(s)}</strong> matched to specialization <strong>${escapeHtml(d.matchedSpecialization)}</strong>.`; resultsTitle.textContent = `Doctors for ${s}`; resultsSubtitle.textContent = `Specialization match: ${d.matchedSpecialization}`; } else symptomMatch.textContent = d?.message || "No specialization found."; const doctors = Array.isArray(d?.doctors) ? d.doctors : []; renderDoctorCards(doctors, doctorResults); resultsCount.textContent = `${doctors.length} doctors`; doctorCount.textContent = doctors.length; } catch(e) { clearSymptomContext(); symptomMatch.className = "symptom-match d-none"; showMessage(e.message); } }
function setNearbyLoading(v) { nearbyButton.disabled = v; nearbyButtonText.textContent = v ? "Finding..." : "Use my location"; nearbySpinner.classList.toggle("d-none", !v); }
function resetMap() { mapPanel.classList.add("d-none"); clinicMap.removeAttribute("src"); routeButton.classList.add("disabled"); routeButton.removeAttribute("href"); mapSummary.textContent = "Allow location access to see the nearest clinic on the map."; }
function showNearestClinicMap(patientLat, patientLng, nearest) {
  const clinic = nearest?.doctor?.clinic;
  const lat = Number(clinic?.latitude);
  const lng = Number(clinic?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    resetMap();
    mapSummary.textContent = "The nearest result has no clinic coordinates, so a map route cannot be generated.";
    mapPanel.classList.remove("d-none");
    return;
  }
  const pad = 0.012;
  const bbox = `${lng-pad},${lat-pad},${lng+pad},${lat+pad}`;
  clinicMap.src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
  const clinicName = clinic?.name || "Nearest clinic";
  const distance = Number(nearest?.distanceKm);
  mapSummary.textContent = `${clinicName}${Number.isFinite(distance) && distance !== Number.MAX_VALUE ? ` • ${distance.toFixed(2)} km away` : ""}`;
  routeButton.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(patientLat+","+patientLng)}&destination=${encodeURIComponent(lat+","+lng)}&travelmode=driving`;
  routeButton.classList.remove("disabled");
  mapPanel.classList.remove("d-none");
}
function findNearbyDoctors() { if (!navigator.geolocation) return showMessage("Your browser does not support location access.", "warning"); setNearbyLoading(true); locationStatus.textContent = "Requesting your current location..."; navigator.geolocation.getCurrentPosition(async p => { try {
   // A successful symptom search takes priority over the manual specialization field.
   // This guarantees that "Symptom -> Nearby Doctor" returns only doctors for
   // the specialization matched to that symptom, still sorted by distance.
   const specValue = activeSymptomSpecialization || specializationInput.value.trim();
   const specParam = specValue ? `&spec=${encodeURIComponent(specValue)}` : "";
   const d = await fetchJson(`${API_BASE_URL}/api/doctors/nearest?lat=${encodeURIComponent(p.coords.latitude)}&lng=${encodeURIComponent(p.coords.longitude)}${specParam}`);
   renderDoctorCards(d, nearbyResults);
   locationStatus.textContent = specValue
     ? `${Array.isArray(d) ? d.length : 0} nearby ${specValue} doctor(s) returned.`
     : `${Array.isArray(d) ? d.length : 0} nearest doctor(s) returned.`;
   const nearest = Array.isArray(d) ? d.find(x => Number.isFinite(Number(x?.distanceKm)) && Number(x.distanceKm) !== Number.MAX_VALUE && x?.doctor?.clinic?.latitude != null && x?.doctor?.clinic?.longitude != null) : null; if (nearest) showNearestClinicMap(p.coords.latitude, p.coords.longitude, nearest); else { resetMap(); mapSummary.textContent = "No clinic with valid coordinates was returned by the backend."; mapPanel.classList.remove("d-none"); } } catch(e) { showMessage(e.message); resetMap(); } finally { setNearbyLoading(false); } }, e => { locationStatus.textContent = e.code === 1 ? "Location permission denied." : "Unable to obtain your location."; showMessage(locationStatus.textContent, "warning"); setNearbyLoading(false); resetMap(); }, { enableHighAccuracy:false, timeout:10000, maximumAge:300000 }); }

function statusBadge(status) { const s = String(status || "").toUpperCase(); const cls = s === "CONFIRMED" ? "success" : s === "COMPLETED" ? "primary" : s === "CANCELLED" ? "secondary" : "warning"; return `<span class="badge text-bg-${cls}">${escapeHtml(s || "PENDING")}</span>`; }
function appointmentDoctor(a) { return a?.doctor?.user?.name || "Doctor"; }
let currentAppointments = [];
let reviewModal;
function reviewDoctorName(a){ return appointmentDoctor(a); }
function openReview(id){
  const a=currentAppointments.find(x=>String(x.id)===String(id));
  if(!a) return;
  document.getElementById("reviewAppointmentId").value=a.id;
  document.getElementById("reviewDoctor").textContent=reviewDoctorName(a);
  document.getElementById("reviewRating").value="5";
  document.getElementById("reviewComment").value="";
  const m=document.getElementById("reviewModalMsg"); m.className="alert d-none mt-3 mb-0"; m.textContent="";
  reviewModal = reviewModal || new bootstrap.Modal(document.getElementById("reviewModal"));
  reviewModal.show();
}
async function submitReview(){
  const appointmentId=document.getElementById("reviewAppointmentId").value;
  const rating=Number(document.getElementById("reviewRating").value);
  const comment=document.getElementById("reviewComment").value.trim();
  const m=document.getElementById("reviewModalMsg");
  if(!appointmentId || rating<1 || rating>5){ m.className="alert alert-warning mt-3 mb-0"; m.textContent="Please select a valid rating."; return; }
  const btn=document.getElementById("submitReview"); btn.disabled=true; btn.textContent="Submitting...";
  try{
    await fetchJson(`${API_BASE_URL}/api/reviews`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({appointmentId:Number(appointmentId),rating,comment})});
    m.className="alert alert-success mt-3 mb-0"; m.textContent="Review submitted successfully.";
    setTimeout(()=>{ if(reviewModal) reviewModal.hide(); },700);
  }catch(e){ m.className="alert alert-danger mt-3 mb-0"; m.textContent=e.message; }
  finally{ btn.disabled=false; btn.textContent="Submit review"; }
}
async function loadAppointments() { const pid = getPatientId(); if (!pid) { appointmentResults.innerHTML = '<div class="info-note">Patient account ID is loaded automatically from your login.</div>'; return; } appointmentResults.innerHTML = '<div class="empty-state">Loading appointments...</div>'; try { const list = await fetchJson(`${API_BASE_URL}/api/appointments/patient/${pid}`); currentAppointments=Array.isArray(list)?list:[]; if (!currentAppointments.length) { appointmentResults.innerHTML = '<div class="empty-state">No appointments found.</div>'; return; } appointmentResults.innerHTML = currentAppointments.map(a => `<article class="appointment-item"><div><strong>${escapeHtml(appointmentDoctor(a))}</strong><div class="small text-secondary">${escapeHtml(a?.slot?.slotDate || "Date unavailable")} ${escapeHtml(a?.slot?.slotTime || "")} • ${escapeHtml(a?.doctor?.specialization || "")}</div><div class="small mt-1">Reason: ${escapeHtml(a?.reason || "—")}</div></div><div class="text-end">${statusBadge(a?.status)}${["PENDING","CONFIRMED"].includes(String(a?.status).toUpperCase()) ? `<button class="btn btn-outline-danger btn-sm mt-2 cancel-appointment" data-id="${a.id}">Cancel</button>` : ""}${String(a?.status).toUpperCase()==="COMPLETED" ? `<button class="btn btn-outline-primary btn-sm mt-2 ms-1 review-button review-appointment" data-id="${a.id}">Rate & Review</button>` : ""}</div></article>`).join(""); appointmentResults.querySelectorAll(".cancel-appointment").forEach(b => b.onclick = () => cancelAppointment(b.dataset.id)); appointmentResults.querySelectorAll(".review-appointment").forEach(b => b.onclick = () => openReview(b.dataset.id)); } catch(e) { appointmentResults.innerHTML = `<div class="info-note text-danger">${escapeHtml(e.message)}</div>`; } }

async function cancelAppointment(id) { if (!confirm("Cancel this appointment?")) return; try { await fetchJson(`${API_BASE_URL}/api/appointments/${id}`, { method:"DELETE" }); showMessage("Appointment cancelled successfully.", "success"); await loadAppointments(); } catch(e) { showMessage(e.message); } }
async function loadFavorites() { const pid = getPatientId(); if (!pid) { favoriteResults.innerHTML = '<div class="info-note">Patient account ID is loaded automatically from your login.</div>'; return; } favoriteResults.innerHTML = '<div class="empty-state">Loading favorites...</div>'; try { const list = await fetchJson(`${API_BASE_URL}/api/favorites/patient/${pid}`); if (!Array.isArray(list) || !list.length) { favoriteResults.innerHTML = '<div class="empty-state">No favorite doctors yet.</div>'; return; } favoriteResults.innerHTML = list.map(f => `<article class="favorite-item"><div><strong>${escapeHtml(doctorName(f?.doctor))}</strong><div class="small text-secondary">${escapeHtml(f?.doctor?.specialization || "")}</div><div class="small text-secondary">${escapeHtml(clinicText(f?.doctor))}</div></div><div class="d-flex gap-2"><button class="btn btn-outline-primary btn-sm favorite-profile" data-doctor-id="${f?.doctor?.id}">Profile</button><button class="btn btn-outline-danger btn-sm remove-favorite" data-doctor-id="${f?.doctor?.id}">Remove</button></div></article>`).join(""); favoriteResults.querySelectorAll(".favorite-profile").forEach(b => b.onclick=()=>{sessionStorage.setItem("medislotSelectedDoctorId",b.dataset.doctorId);location.href="doctor-profile.html"}); favoriteResults.querySelectorAll(".remove-favorite").forEach(b=>b.onclick=()=>removeFavorite(b.dataset.doctorId)); } catch(e) { favoriteResults.innerHTML = `<div class="info-note text-danger">${escapeHtml(e.message)}</div>`; } }
async function removeFavorite(doctorId) { const pid=getPatientId(); if(!pid)return; try { await fetchJson(`${API_BASE_URL}/api/favorites?patientId=${pid}&doctorId=${doctorId}`,{method:"DELETE"}); await loadFavorites(); showMessage("Doctor removed from favorites.","success"); } catch(e){showMessage(e.message);} }

document.getElementById("logoutButton").onclick=()=>{sessionStorage.clear();location.href="login.html"};
specializationButton.onclick=searchSpecialization; allDoctorsButton.onclick=loadAllDoctors; symptomButton.onclick=searchSymptom; nearbyButton.onclick=findNearbyDoctors;
specializationInput.onkeydown=e=>{if(e.key==="Enter")searchSpecialization()}; symptomInput.onkeydown=e=>{if(e.key==="Enter")searchSymptom()};
const user=getLoggedInUser(); if(!user){location.href="login.html"} else if(String(user.role).toUpperCase()!=="PATIENT"){showMessage("This dashboard is only available to patient accounts.","warning");setTimeout(()=>location.href="login.html",1200)} else {userName.textContent=user.name||"Patient";loadAllDoctors();loadAppointments();loadFavorites();}

const reviewSubmitButton=document.getElementById("submitReview"); if(reviewSubmitButton) reviewSubmitButton.onclick=submitReview;
