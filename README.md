# MediSlot

MediSlot is a doctor appointment management application with a static web
frontend and a Spring Boot REST API. Patients can discover doctors, manage
appointments and favourites, while doctors and administrators manage profiles,
schedules, clinics, and verification workflows.

## Project layout

- `medislot-frontend/` — HTML, CSS, and vanilla JavaScript user interface.
- `medislot-backend/` — Java 21, Spring Boot, Spring Data JPA, and PostgreSQL API.
- `medislot-backend/render.yaml` — Render deployment configuration for the backend.
- `vercel.json` — Vercel configuration for the frontend and API rewrites.

## Run locally

1. Start PostgreSQL and configure the datasource environment variables if needed:
   `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
   `SPRING_DATASOURCE_PASSWORD`.
2. Start the backend:
   ```sh
   cd medislot-backend
   mvn spring-boot:run
   ```
3. Serve `medislot-frontend/` from a local static web server and open
   `login.html`.

The API listens on port `8080` by default. More detailed setup and API
documentation is available in `medislot-backend/README.md`.
