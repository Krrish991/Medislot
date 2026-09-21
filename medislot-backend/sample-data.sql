-- ============================================================
-- Sample seed data for MediSlot
-- Run this AFTER the backend has started once (so Hibernate has
-- already auto-created the tables via ddl-auto=update).
-- ============================================================

-- Clinics with real Mumbai-area coordinates, to test the
-- "nearest doctor" map feature.
INSERT INTO clinics (name, address, city, latitude, longitude) VALUES
('MediSlot Clinic - Thane', 'Gokhale Road, Naupada', 'Thane', 19.1943, 72.9698),
('MediSlot Clinic - Dadar', 'Ranade Road, Dadar West', 'Dadar', 19.0178, 72.8478),
('MediSlot Clinic - Borivali', 'S.V. Road, Borivali West', 'Borivali', 19.2288, 72.8567),
('MediSlot Clinic - Mulund', 'L.B.S. Marg, Mulund West', 'Mulund', 19.1726, 72.9425);

-- Sample users (password stored as plain text here — for demo only)
INSERT INTO users (name, email, password, role, created_at) VALUES
('Dr. Ananya Rao', 'ananya.rao@medislot.com', 'doctor123', 'DOCTOR', NOW()),
('Dr. Rohit Mehta', 'rohit.mehta@medislot.com', 'doctor123', 'DOCTOR', NOW()),
('Krrish Sharma', 'krrish@example.com', 'patient123', 'PATIENT', NOW());

-- Doctors (linked to users + clinics above). Adjust user_id/clinic_id
-- to match the actual auto-generated IDs on your machine.
INSERT INTO doctors (user_id, clinic_id, specialization, qualification, experience_years, consultation_fee, available_days, verified) VALUES
(1, 1, 'General Physician', 'MBBS, MD', 8, 300, 'MON,WED,FRI', true),
(2, 2, 'Cardiology', 'MBBS, DM Cardiology', 14, 800, 'TUE,THU,SAT', true);

-- Patient profile
INSERT INTO patients (user_id, phone, age, gender) VALUES
(3, '9876543210', 21, 'Male');

-- NOTE: A patient searching from Dombivli (approx lat 19.2183, lng 73.0864)
-- should see the Thane clinic (~11 km away) ranked before the Dadar
-- clinic (~28 km away) when calling:
--   GET /api/doctors/nearest?lat=19.2183&lng=73.0864

-- ============================================================
-- Doctor-Clinic Schedule (feature: one doctor, multiple clinics
-- on different days). Dr. Ananya Rao (doctor id 1) sits at Thane
-- on Mon/Wed, and at Borivali on Tue/Thu.
-- ============================================================
INSERT INTO doctor_clinic_schedule (doctor_id, clinic_id, day_of_week, start_time, end_time) VALUES
(1, 1, 'MONDAY', '10:00:00', '14:00:00'),
(1, 1, 'WEDNESDAY', '10:00:00', '14:00:00'),
(1, 3, 'TUESDAY', '16:00:00', '20:00:00'),
(1, 3, 'THURSDAY', '16:00:00', '20:00:00');

-- ============================================================
-- Symptom -> Specialization mapping (feature: symptom-based search)
-- ============================================================
INSERT INTO symptom_specialization_map (symptom_keyword, specialization) VALUES
('fever', 'General Physician'),
('cold', 'General Physician'),
('cough', 'General Physician'),
('toothache', 'Dentistry'),
('chest pain', 'Cardiology'),
('skin rash', 'Dermatology'),
('acne', 'Dermatology'),
('child vaccination', 'Pediatrics'),
('joint pain', 'Orthopedics'),
('fracture', 'Orthopedics');

-- ============================================================
-- Sample favorite (patient 1 bookmarks doctor 2)
-- ============================================================
INSERT INTO favorites (patient_id, doctor_id) VALUES (1, 2);
