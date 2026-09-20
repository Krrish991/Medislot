package com.medislot.backend.controller;

import com.medislot.backend.entity.Doctor;
import com.medislot.backend.entity.Favorite;
import com.medislot.backend.entity.Patient;
import com.medislot.backend.repository.DoctorRepository;
import com.medislot.backend.repository.FavoriteRepository;
import com.medislot.backend.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;

    // CREATE - patient bookmarks a doctor
    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody Map<String, Long> body) {
        Long patientId = body.get("patientId");
        Long doctorId = body.get("doctorId");

        if (favoriteRepository.existsByPatientIdAndDoctorId(patientId, doctorId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "This doctor is already in your favorites"));
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Favorite favorite = new Favorite();
        favorite.setPatient(patient);
        favorite.setDoctor(doctor);

        return ResponseEntity.ok(favoriteRepository.save(favorite));
    }

    // READ - a patient favorite doctors list
    @GetMapping("/patient/{patientId}")
    public List<Favorite> getFavorites(@PathVariable Long patientId) {
        return favoriteRepository.findByPatientId(patientId);
    }

    // READ - quick check: is this doctor already favorited by this patient?
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @RequestParam Long patientId, @RequestParam Long doctorId) {
        boolean exists = favoriteRepository.existsByPatientIdAndDoctorId(patientId, doctorId);
        return ResponseEntity.ok(Map.of("isFavorite", exists));
    }

    // DELETE - patient removes a doctor from favorites
    @DeleteMapping
    public ResponseEntity<?> removeFavorite(@RequestParam Long patientId, @RequestParam Long doctorId) {
        return favoriteRepository.findByPatientIdAndDoctorId(patientId, doctorId)
                .map(fav -> {
                    favoriteRepository.delete(fav);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
