# MediSlot Backend — Spring Boot REST API

Doctor Appointment Management System backend. Java 21 + Spring Boot 3.2 +
Spring Data JPA + PostgreSQL. Pure REST API. Meant to be
called from a separate static HTML/CSS/JS frontend.

## 1. Prerequisites

- JDK 21 installed
- Maven 
- PostgreSQL 16+ running (or a Render Postgres database)

## 2. Setup Steps

1. **Open this folder in VS Code** 
2. Create a PostgreSQL database named `medislot_db`, then provide its
   connection settings with `SPRING_DATASOURCE_URL`,
   `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.
3. Tables are auto-created by Hibernate (`ddl-auto=update`) the first time you
   run the app.
4. **Run the app**:
   - In VS Code terminal: `mvn spring-boot:run`
   - Or use the "Run" button above `main()` in `MedislotBackendApplication.java`
5. Once you see `Tomcat started on port(s): 8080`, the backend is live.
6. (Optional) Load sample test data with `psql` and `sample-data.sql`
   — this adds 4 real clinics (Thane, Dadar, Borivali, Mulund) with actual
   coordinates so you can test the nearest-doctor map feature immediately.

## 3. Project Structure

```
src/main/java/com/medislot/backend/
├── entity/         → JPA entities (User, Doctor, Patient, Clinic, TimeSlot, Appointment, Review)
├── repository/      → Spring Data JPA interfaces
├── service/         → business logic (AuthService, DoctorService, AppointmentService, ReviewService)
├── controller/       → REST endpoints (@RestController classes)
├── dto/             → request/response objects
├── config/          → CorsConfig (allows the separate frontend to call these APIs)
└── MedislotBackendApplication.java
```

## 4. API Reference

### Auth
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password, role, clinicId?, specialization?, ...}` | Register patient or doctor |
| POST | `/api/auth/login` | `{email, password}` | Login |

### Doctors
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | All verified doctors |
| GET | `/api/doctors?spec=Cardiology` | Filter by specialization |
| GET | `/api/doctors/{id}` | Single doctor profile |
| GET | `/api/doctors/nearest?lat=19.21&lng=73.08&spec=Cardiology` | **Nearest doctors sorted by distance (map feature)** — now uses each doctor's ACTIVE clinic today, not just a fixed default |
| GET | `/api/doctors/{id}/available-today` | **Availability badge** — `{ "availableToday": true/false }` |
| PUT | `/api/doctors/{id}` | Update doctor profile |
| PUT | `/api/doctors/{id}/verify` | Admin approves a doctor |
| DELETE | `/api/doctors/{id}` | Admin removes a doctor |

### Doctor Multi-Clinic Schedule (NEW)
A doctor can sit at different clinics on different days/times (e.g. Thane
on Mon/Wed, Dadar on Tue/Thu). `/api/doctors/nearest` automatically uses
whichever clinic is active right now for each doctor.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/schedules` | `{doctorId, clinicId, dayOfWeek, startTime, endTime}` — add a slot |
| GET | `/api/schedules/doctor/{doctorId}` | Full weekly schedule for a doctor |
| GET | `/api/schedules/doctor/{doctorId}/active-now` | Which clinic the doctor is at RIGHT NOW |
| DELETE | `/api/schedules/{id}` | Remove a schedule slot |

### Symptom-Based Search (NEW)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/symptoms/search?q=fever` | Returns matched specialization + list of doctors |
| POST | `/api/symptoms` | Admin adds `{symptomKeyword, specialization}` mapping |
| GET | `/api/symptoms` | List all mappings |
| DELETE | `/api/symptoms/{id}` | Remove a mapping |

### Favorite Doctors (NEW)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/favorites` | `{patientId, doctorId}` — bookmark a doctor |
| GET | `/api/favorites/patient/{patientId}` | A patient's favorite doctors |
| GET | `/api/favorites/check?patientId=1&doctorId=3` | Quick check `{isFavorite: true/false}` |
| DELETE | `/api/favorites?patientId=1&doctorId=3` | Remove a favorite |

### Clinics (admin)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/clinics` | Add clinic `{name, address, city, latitude, longitude}` |
| GET | `/api/clinics` | List all clinics |
| PUT | `/api/clinics/{id}` | Update clinic |
| DELETE | `/api/clinics/{id}` | Delete clinic |

### Time Slots
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/slots` | `{doctorId, date, time}` — doctor adds availability |
| GET | `/api/slots/doctor/{doctorId}?date=2026-08-05` | Available slots on a date |
| DELETE | `/api/slots/{id}` | Remove a slot |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appointments` | `{patientId, doctorId, slotId, reason}` — book |
| GET | `/api/appointments/patient/{patientId}` | Patient's appointments |
| GET | `/api/appointments/doctor/{doctorId}` | Doctor's appointments |
| PUT | `/api/appointments/{id}/status` | `{status: "CONFIRMED"}` — pending/confirmed/completed/cancelled |
| DELETE | `/api/appointments/{id}` | Delete appointment record |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reviews` | `{appointmentId, rating, comment}` — only after COMPLETED appointment |
| GET | `/api/reviews/doctor/{doctorId}` | All reviews + average rating for a doctor |

## 5. Testing Quickly with Postman / Browser

Once running, open in browser:
```
http://localhost:8080/api/doctors
```
You should see a JSON array (empty until you register a doctor or run `sample-data.sql`).

To test the **nearest-clinic** feature (Dombivli patient example):
```
http://localhost:8080/api/doctors/nearest?lat=19.2183&lng=73.0864
```
This returns doctors sorted nearest-first, each with a `distanceKm` field.

## 6. Connecting Your Frontend

In your frontend JS files, replace mock data calls with real fetch() calls, e.g.:
```javascript
fetch("http://localhost:8080/api/doctors")
  .then(res => res.json())
  .then(doctors => { /* render doctor cards */ });
```
CORS is already configured (`config/CorsConfig.java`) so this works even
though the frontend runs on a different port (e.g. Live Server on :5500).

## 7. Notes

- Passwords are stored as plain text for simplicity — fine for a college
  demo, but mention in your report that a real system would hash passwords
  (e.g. with BCrypt / Spring Security).
- The frontend's Geolocation-based "Find Nearby Doctors" button should call
  `navigator.geolocation.getCurrentPosition()` to get the patient's lat/lng,
  then pass those into `/api/doctors/nearest`.
- For the actual road route drawn on the map (not just distance), use
  Leaflet.js + OSRM on the frontend as discussed separately — the backend
  only needs to provide sorted distance data, the routing itself happens
  client-side against the free OSRM API.
