const API = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8080" : "";
const $ = id => document.getElementById(id);

let doctorId = sessionStorage.getItem('medislotSelectedDoctorId');
let selectedSlot = null;

doctorId = doctorId && Number.isFinite(Number(doctorId)) ? Number(doctorId) : null;

function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function get(url, options = {}) {
  const r = await fetch(url, options);
  const d = await r.json().catch(() => null);
  if (!r.ok) throw Error(d?.message || `Request failed (${r.status})`);
  return d;
}

function initials(n) {
  return String(n || 'Doctor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(x => x[0])
    .join('')
    .toUpperCase();
}

function time(t) {
  return t ? String(t).slice(0, 5) : '—';
}

function msg(t, type = 'danger') {
  $('msg').className = `alert alert-${type}`;
  $('msg').textContent = t;
}

function patientId() {
  const x = sessionStorage.getItem('medislotPatientId');
  const id = x ? Number(x) : null;
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function profile() {
  const d = await get(`${API}/api/doctors/${doctorId}`);
  const n = d?.user?.name || 'Doctor';

  $('avatar').textContent = initials(n);
  $('name').textContent = n;
  $('spec').textContent = d?.specialization || 'Specialization not specified';
  $('qualification').textContent = d?.qualification ? `Qualification: ${d.qualification}` : '';
  $('clinic').textContent = d?.clinic
    ? [d.clinic.name, d.clinic.address, d.clinic.city].filter(Boolean).join(' • ')
    : 'Clinic information unavailable';
  $('exp').textContent = d?.experienceYears != null ? `${d.experienceYears} yrs` : '—';
  $('fee').textContent = d?.consultationFee != null ? `₹${Number(d.consultationFee).toFixed(0)}` : '—';

  await favoriteState();
}

async function favoriteState() {
  const pid = patientId();
  const b = $('favoriteButton');

  if (!pid) {
    b.textContent = '♡ Favorite';
    b.title = 'Patient ID is loaded automatically from your login';
    b.dataset.favorite = 'false';
    return;
  }

  try {
    const data = await get(`${API}/api/favorites/check?patientId=${pid}&doctorId=${doctorId}`);
    const fav = typeof data === 'boolean'
      ? data
      : (data?.favorite ?? data?.isFavorite ?? false);

    b.textContent = fav ? '♥ Favorited' : '♡ Favorite';
    b.classList.toggle('btn-danger', !!fav);
    b.classList.toggle('btn-outline-danger', !fav);
    b.dataset.favorite = String(!!fav);
  } catch (e) {
    b.textContent = '♡ Favorite';
    b.classList.remove('btn-danger');
    b.classList.add('btn-outline-danger');
    b.dataset.favorite = 'false';
  }
}

$('favoriteButton').onclick = async () => {
  const pid = patientId();
  if (!pid) {
    msg('Patient ID could not be loaded. Please log in again before using favorites.', 'warning');
    return;
  }

  const isFav = $('favoriteButton').dataset.favorite === 'true';

  try {
    if (isFav) {
      await get(`${API}/api/favorites?patientId=${pid}&doctorId=${doctorId}`, { method: 'DELETE' });
    } else {
      await get(`${API}/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: Number(pid), doctorId: Number(doctorId) })
      });
    }

    await favoriteState();
    msg(isFav ? 'Doctor removed from favorites.' : 'Doctor added to favorites.', 'success');
  } catch (e) {
    msg(e.message);
  }
};

async function today() {
  try {
    const d = await get(`${API}/api/doctors/${doctorId}/available-today`);
    $('today').innerHTML = d?.availableToday
      ? '<span class="badge text-bg-success">Available Today</span>'
      : '<span class="badge text-bg-secondary">Not Available Today</span>';
  } catch (e) {
    $('today').textContent = '';
  }
}

async function schedule() {
  try {
    const a = await get(`${API}/api/schedules/doctor/${doctorId}`);
    $('schedule').innerHTML = a?.length
      ? a.map(x => `
          <div class="schedule-row d-flex justify-content-between gap-2">
            <span>
              <b>${esc(x.dayOfWeek)}</b><br>
              <span class="text-secondary">${esc(x.clinic?.name || 'Clinic')}</span>
            </span>
            <span class="text-secondary">${time(x.startTime)} – ${time(x.endTime)}</span>
          </div>`).join('')
      : '<div class="empty">No schedule found.</div>';
  } catch (e) {
    $('schedule').innerHTML = `<div class="empty">Unable to load schedule.</div>`;
  }
}

async function reviews() {
  try {
    const d = await get(`${API}/api/reviews/doctor/${doctorId}`);
    $('rating').textContent = Number(d?.averageRating || 0).toFixed(1);
    $('reviews').textContent = d?.totalReviews ?? 0;

    const a = d?.reviews || [];
    $('reviewList').innerHTML = a.length
      ? a.map(r => `
          <div class="review">
            <b>${esc(r?.patient?.user?.name || 'Patient')}</b>
            <span class="float-end">${esc(r?.rating)}/5</span>
            <div class="text-secondary mt-1">${esc(r?.comment || 'No comment')}</div>
          </div>`).join('')
      : '<div class="empty">No reviews yet.</div>';
  } catch (e) {
    $('reviewList').innerHTML = '<div class="empty">Unable to load reviews.</div>';
  }
}

async function slots() {
  selectedSlot = null;
  $('booking').classList.add('d-none');
  $('slotStatus').textContent = 'Loading...';
  $('slots').innerHTML = '<div class="empty">Loading slots...</div>';

  try {
    const a = await get(`${API}/api/slots/doctor/${doctorId}?date=${encodeURIComponent($('date').value)}`);

    if (!Array.isArray(a) || !a.length) {
      $('slots').innerHTML = '<div class="empty">No available slots for this date.</div>';
      $('slotStatus').textContent = '0 slots';
      return;
    }

    $('slotStatus').textContent = `${a.length} available slot(s)`;
    $('slots').innerHTML = '';

    a.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.textContent = time(s.slotTime);
      b.onclick = () => {
        document.querySelectorAll('.slot.selected').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedSlot = s;
        $('selected').textContent = `${s.slotDate} at ${time(s.slotTime)} • Slot ID ${s.id}`;
        $('booking').classList.remove('d-none');
      };
      $('slots').appendChild(b);
    });
  } catch (e) {
    $('slotStatus').textContent = '';
    $('slots').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

$('date').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString().slice(0, 10);
$('date').min = $('date').value;
$('date').onchange = slots;

$('book').onclick = async () => {
  const pid = patientId();

  if (!pid) {
    $('patientWarning').classList.remove('d-none');
    msg('Patient ID could not be loaded. Please log in again before booking.', 'warning');
    return;
  }

  $('patientWarning').classList.add('d-none');

  if (!selectedSlot || !$('reason').value.trim()) {
    msg('Select a slot and enter the reason for your visit.', 'warning');
    return;
  }

  try {
    const d = await get(`${API}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: Number(pid),
        doctorId: Number(doctorId),
        slotId: Number(selectedSlot.id),
        reason: $('reason').value.trim()
      })
    });

    msg(`Appointment #${d.id} booked successfully. Status: ${d.status}`, 'success');
    $('reason').value = '';
    await slots();
  } catch (e) {
    msg(e.message);
  }
};

$('logout').onclick = () => {
  sessionStorage.clear();
  location.href = 'login.html';
};

(async () => {
  let u;
  try {
    u = JSON.parse(sessionStorage.getItem('medislotUser') || 'null');
  } catch (_) {
    u = null;
  }

  if (!u || String(u.role).toUpperCase() !== 'PATIENT') {
    location.href = 'patient-dashboard.html';
    return;
  }

  if (!doctorId) {
    $('loading').classList.add('d-none');
    msg('Doctor information is missing. Please return to Find Doctors and select a doctor again.', 'warning');
    return;
  }

  try {
    // Load the profile first. Other sections are independent, so a failure
    // in reviews/schedule/availability must not keep the whole page stuck on Loading.
    await profile();
    $('loading').classList.add('d-none');
    $('content').classList.remove('d-none');

    await Promise.allSettled([
      today(),
      schedule(),
      reviews(),
      slots()
    ]);
  } catch (e) {
    $('loading').classList.add('d-none');
    msg(e.message || 'Unable to load doctor profile.', 'danger');
  }
})();
