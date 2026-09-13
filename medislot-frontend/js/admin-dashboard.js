const API = (["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "") + '/api';
const user = JSON.parse(sessionStorage.getItem('medislotUser') || 'null');

if (!user || user.role !== 'ADMIN') {
  window.location.href = 'login.html';
  throw new Error('Admin access required');
}

const state = { doctors: [], clinics: [], symptoms: [] };
const doctorModal = new bootstrap.Modal(document.getElementById('doctorModal'));
const clinicModal = new bootstrap.Modal(document.getElementById('clinicModal'));
const symptomModal = new bootstrap.Modal(document.getElementById('symptomModal'));

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function showAlert(message, type='success') {
  const el = document.getElementById('pageAlert');
  el.className = `alert alert-${type}`;
  el.textContent = message;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => el.classList.add('d-none'), 4500);
}
async function request(path, options={}) {
  const response = await fetch(API + path, { headers: { 'Content-Type':'application/json', ...(options.headers || {}) }, ...options });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  return data;
}
function emptyRow(cols, text='No records found.') { return `<tr><td colspan="${cols}" class="text-center text-secondary py-4">${esc(text)}</td></tr>`; }

async function loadDoctors() {
  const body = document.getElementById('doctorTableBody');
  try {
    state.doctors = await request('/doctors');
    document.getElementById('doctorCount').textContent = `${state.doctors.length} doctor${state.doctors.length === 1 ? '' : 's'}`;
    body.innerHTML = state.doctors.length ? state.doctors.map(d => {
      const u = d.user || {};
      return `<tr>
        <td><div class="fw-semibold">Dr. ${esc(u.name || 'Unknown')}</div><div class="small text-secondary">${esc(u.email || '')}</div></td>
        <td>${esc(d.specialization || '-')}</td><td>${esc(d.qualification || '-')}</td><td>${esc(d.experienceYears ?? 0)} yrs</td>
        <td>₹${esc(d.consultationFee ?? 0)}</td><td><span class="badge ${d.verified ? 'text-bg-success' : 'text-bg-warning'} status-badge">${d.verified ? 'Verified' : 'Pending'}</span></td>
        <td><div class="action-group">${!d.verified ? `<button class="btn btn-sm btn-success" data-action="verify-doctor" data-id="${d.id}">Verify</button>` : ''}<button class="btn btn-sm btn-outline-primary" data-action="edit-doctor" data-id="${d.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-action="delete-doctor" data-id="${d.id}">Delete</button></div></td>
      </tr>`;
    }).join('') : emptyRow(7);
  } catch (e) { body.innerHTML = emptyRow(7, 'Unable to load doctors.'); showAlert(e.message, 'danger'); }
}

async function verifyDoctor(id) {
  if (!confirm('Verify this doctor?')) return;
  try { await request(`/doctors/${id}/verify`, { method:'PUT' }); showAlert('Doctor verified successfully.'); await loadDoctors(); }
  catch(e){ showAlert(e.message, 'danger'); }
}
function openDoctorEdit(id) {
  const d = state.doctors.find(x => String(x.id) === String(id)); if (!d) return;
  const u = d.user || {};
  document.getElementById('doctorId').value = d.id; document.getElementById('doctorName').value = u.name || ''; document.getElementById('doctorEmail').value = u.email || '';
  document.getElementById('doctorSpecialization').value = d.specialization || ''; document.getElementById('doctorQualification').value = d.qualification || '';
  document.getElementById('doctorExperience').value = d.experienceYears ?? 0; document.getElementById('doctorFee').value = d.consultationFee ?? 0; document.getElementById('doctorDays').value = d.availableDays || '';
  doctorModal.show();
}
async function deleteDoctor(id) {
  if (!confirm('Delete this doctor? This action cannot be undone.')) return;
  try { await request(`/doctors/${id}`, { method:'DELETE' }); showAlert('Doctor deleted successfully.'); await loadDoctors(); }
  catch(e){ showAlert(e.message, 'danger'); }
}

document.getElementById('doctorForm').addEventListener('submit', async e => {
  e.preventDefault(); const id = document.getElementById('doctorId').value;
  const payload = { specialization: document.getElementById('doctorSpecialization').value.trim(), qualification: document.getElementById('doctorQualification').value.trim(), experienceYears: Number(document.getElementById('doctorExperience').value), consultationFee: Number(document.getElementById('doctorFee').value), availableDays: document.getElementById('doctorDays').value.trim() };
  try { await request(`/doctors/${id}`, { method:'PUT', body:JSON.stringify(payload) }); doctorModal.hide(); showAlert('Doctor details updated.'); await loadDoctors(); } catch(e){ showAlert(e.message,'danger'); }
});

async function loadClinics() {
  const body = document.getElementById('clinicTableBody');
  try { state.clinics = await request('/clinics'); body.innerHTML = state.clinics.length ? state.clinics.map(c => `<tr><td class="fw-semibold">${esc(c.name)}</td><td>${esc(c.address)}</td><td>${esc(c.city)}</td><td>${esc(c.latitude ?? '-')}</td><td>${esc(c.longitude ?? '-')}</td><td><div class="action-group"><button class="btn btn-sm btn-outline-primary" data-action="edit-clinic" data-id="${c.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-action="delete-clinic" data-id="${c.id}">Delete</button></div></td></tr>`).join('') : emptyRow(6); }
  catch(e){ body.innerHTML=emptyRow(6,'Unable to load clinics.'); showAlert(e.message,'danger'); }
}
function openClinicForm(id=null) {
  const c = id ? state.clinics.find(x => String(x.id) === String(id)) : null;
  document.getElementById('clinicModalTitle').textContent = c ? 'Edit Clinic' : 'Add Clinic'; document.getElementById('clinicId').value = c?.id || '';
  document.getElementById('clinicName').value = c?.name || ''; document.getElementById('clinicAddress').value = c?.address || ''; document.getElementById('clinicCity').value = c?.city || '';
  document.getElementById('clinicLatitude').value = c?.latitude ?? ''; document.getElementById('clinicLongitude').value = c?.longitude ?? ''; clinicModal.show();
}
document.getElementById('clinicForm').addEventListener('submit', async e => { e.preventDefault(); const id=document.getElementById('clinicId').value; const payload={name:document.getElementById('clinicName').value.trim(),address:document.getElementById('clinicAddress').value.trim(),city:document.getElementById('clinicCity').value.trim(),latitude:Number(document.getElementById('clinicLatitude').value)||0,longitude:Number(document.getElementById('clinicLongitude').value)||0}; try{await request(id?`/clinics/${id}`:'/clinics',{method:id?'PUT':'POST',body:JSON.stringify(payload)});clinicModal.hide();showAlert(id?'Clinic updated.':'Clinic added.');await loadClinics();}catch(e){showAlert(e.message,'danger');} });
async function deleteClinic(id){if(!confirm('Delete this clinic?'))return;try{await request(`/clinics/${id}`,{method:'DELETE'});showAlert('Clinic deleted.');await loadClinics();}catch(e){showAlert(e.message,'danger');}}

async function loadSymptoms() {
  const body=document.getElementById('symptomTableBody'); try{state.symptoms=await request('/symptoms');renderSymptoms();}catch(e){body.innerHTML=emptyRow(3,'Unable to load mappings.');showAlert(e.message,'danger');}
}
function renderSymptoms(){const filter=document.getElementById('symptomFilter').value.trim().toLowerCase();const list=state.symptoms.filter(s=>`${s.symptomKeyword||''} ${s.specialization||''}`.toLowerCase().includes(filter));document.getElementById('symptomTableBody').innerHTML=list.length?list.map(s=>`<tr><td class="fw-semibold">${esc(s.symptomKeyword)}</td><td>${esc(s.specialization)}</td><td><div class="action-group"><button class="btn btn-sm btn-outline-primary" data-action="edit-symptom" data-id="${s.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-action="delete-symptom" data-id="${s.id}">Delete</button></div></td></tr>`).join(''):emptyRow(3,'No matching mappings.');}

function openSymptomEdit(id) {
  const s = state.symptoms.find(x => String(x.id) === String(id));
  if (!s) return;
  document.getElementById('symptomModalTitle').textContent = 'Edit Symptom Mapping';
  document.getElementById('symptomSubmitBtn').textContent = 'Update Mapping';
  document.getElementById('symptomId').value = s.id;
  document.getElementById('symptomKeyword').value = s.symptomKeyword || '';
  document.getElementById('symptomSpecialization').value = s.specialization || '';
  symptomModal.show();
}

document.getElementById('symptomForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('symptomId').value;
  const payload = { symptomKeyword: document.getElementById('symptomKeyword').value.trim().toLowerCase(), specialization: document.getElementById('symptomSpecialization').value.trim() };
  try {
    await request(id ? `/symptoms/${id}` : '/symptoms', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    symptomModal.hide();
    e.target.reset();
    document.getElementById('symptomId').value = '';
    showAlert(id ? 'Symptom mapping updated.' : 'Symptom mapping added.');
    await loadSymptoms();
  } catch (e) { showAlert(e.message, 'danger'); }
});

async function deleteSymptom(id){if(!confirm('Delete this symptom mapping?'))return;try{await request(`/symptoms/${id}`,{method:'DELETE'});showAlert('Symptom mapping deleted.');await loadSymptoms();}catch(e){showAlert(e.message,'danger');}}

document.addEventListener('click', e => { const b=e.target.closest('[data-action]'); if(!b)return; const id=b.dataset.id; if(b.dataset.action==='verify-doctor')verifyDoctor(id); if(b.dataset.action==='edit-doctor')openDoctorEdit(id); if(b.dataset.action==='delete-doctor')deleteDoctor(id); if(b.dataset.action==='edit-clinic')openClinicForm(id); if(b.dataset.action==='delete-clinic')deleteClinic(id); if(b.dataset.action==='edit-symptom')openSymptomEdit(id); if(b.dataset.action==='delete-symptom')deleteSymptom(id); });
document.getElementById('addClinicBtn').addEventListener('click',()=>openClinicForm());
document.getElementById('addSymptomBtn').addEventListener('click',()=>{
  document.getElementById('symptomModalTitle').textContent = 'Add Symptom Mapping';
  document.getElementById('symptomSubmitBtn').textContent = 'Add Mapping';
  document.getElementById('symptomId').value = '';
  document.getElementById('symptomForm').reset();
  symptomModal.show();
});
document.getElementById('symptomFilter').addEventListener('input',renderSymptoms);
document.getElementById('refreshAllBtn').addEventListener('click',()=>Promise.all([loadDoctors(),loadClinics(),loadSymptoms()]));
document.getElementById('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('medislotUser');sessionStorage.removeItem('medislotPatientId');sessionStorage.removeItem('medislotDoctorId');window.location.href='login.html';});

Promise.all([loadDoctors(),loadClinics(),loadSymptoms()]);
