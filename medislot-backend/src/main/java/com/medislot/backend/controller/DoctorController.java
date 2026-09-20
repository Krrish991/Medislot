package com.medislot.backend.controller;

import com.medislot.backend.dto.NearestDoctorResponse;
import com.medislot.backend.entity.Doctor;
import com.medislot.backend.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    // READ - list all verified doctors, optionally filtered by specialization
    @GetMapping
    public List<Doctor> getDoctors(@RequestParam(required = false) String spec) {
        if (spec != null && !spec.isBlank()) {
            return doctorService.getBySpecialization(spec);
        }
        return doctorService.getAllVerifiedDoctors();
    }

@GetMapping("/pending")
public List<Doctor> getPendingDoctors() {
    return doctorService.getPendingDoctors();
}
    // READ - single doctor profile
    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getById(id));
    }

    
    @GetMapping("/nearest")
    public List<NearestDoctorResponse> getNearestDoctors(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false) String spec) {
        return doctorService.getNearestDoctors(lat, lng, spec);
    }

    
      // READ (availability badge) - is this doctor available today?
      // Used for the green/red "Available Today" badge on doctor cards.
     
    @GetMapping("/{id}/available-today")
    public ResponseEntity<Map<String, Boolean>> isAvailableToday(@PathVariable Long id) {
        Doctor doctor = doctorService.getById(id);
        return ResponseEntity.ok(Map.of("availableToday", doctorService.isAvailableToday(doctor)));
    }

    // UPDATE - edit doctor profile (fee, availability, etc.)
    @PutMapping("/{id}")
    public ResponseEntity<Doctor> updateDoctor(@PathVariable Long id, @RequestBody Doctor updated) {
        Doctor doctor = doctorService.getById(id);
        doctor.setSpecialization(updated.getSpecialization());
        doctor.setQualification(updated.getQualification());
        doctor.setExperienceYears(updated.getExperienceYears());
        doctor.setConsultationFee(updated.getConsultationFee());
        doctor.setAvailableDays(updated.getAvailableDays());
        return ResponseEntity.ok(doctorService.save(doctor));
    }

    // UPDATE - admin approves/verifies a newly registered doctor 
    @PutMapping("/{id}/verify")
    public ResponseEntity<Doctor> verifyDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.verifyDoctor(id));
    }

    // DELETE - admin removes a doctor account
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
