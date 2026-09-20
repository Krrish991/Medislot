package com.medislot.backend.controller;

import com.medislot.backend.entity.Doctor;
import com.medislot.backend.entity.SymptomSpecializationMap;
import com.medislot.backend.repository.SymptomSpecializationMapRepository;
import com.medislot.backend.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/symptoms")
public class SymptomController {

    @Autowired private SymptomSpecializationMapRepository symptomRepository;
    @Autowired private DoctorService doctorService;

    /**
     * READ (main feature) - patient types a symptom, gets back both the
     * matched specialization AND the list of doctors for it in one call.
     * e.g. GET /api/symptoms/search?q=fever
     *
     * NOTE: symptomKeyword rows can hold multiple comma-separated keywords,
     * e.g. "tooth decay, gum, oral,mouth" -> Dentist. So each row's keyword
     * list is split and matched individually instead of comparing the
     * whole row as one string.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchBySymptom(@RequestParam String q) {
        String query = q.trim().toLowerCase();

        List<SymptomSpecializationMap> allMappings = symptomRepository.findAll();
        SymptomSpecializationMap match = null;

        for (SymptomSpecializationMap mapping : allMappings) {
            String[] tokens = mapping.getSymptomKeyword().split(",");

            for (String token : tokens) {
                String t = token.trim().toLowerCase();
                if (t.isEmpty()) continue;

                if (t.equals(query) || t.contains(query) || query.contains(t)) {
                    match = mapping;
                    break;
                }
            }
            if (match != null) break;
        }

        if (match != null) {
            List<Doctor> doctors = doctorService.getBySpecialization(match.getSpecialization());
            return ResponseEntity.ok(Map.of(
                    "matchedSpecialization", match.getSpecialization(),
                    "doctors", doctors
            ));
        }

        return ResponseEntity.ok(Map.of(
                "message", "No specialization found for that symptom. Try a different keyword or browse all doctors.",
                "doctors", List.of()
        ));
    }

    // CREATE - admin adds a new symptom -> specialization mapping
    @PostMapping
    public SymptomSpecializationMap addMapping(@RequestBody SymptomSpecializationMap mapping) {
        return symptomRepository.save(mapping);
    }

    // UPDATE - admin edits an existing symptom -> specialization mapping
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMapping(@PathVariable Long id, @RequestBody SymptomSpecializationMap updated) {
        return symptomRepository.findById(id)
                .<ResponseEntity<?>>map(mapping -> {
                    mapping.setSymptomKeyword(updated.getSymptomKeyword());
                    mapping.setSpecialization(updated.getSpecialization());
                    return ResponseEntity.ok(symptomRepository.save(mapping));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // READ - list all mappings at (admin management screen)
    @GetMapping
    public List<SymptomSpecializationMap> getAllMappings() {
        return symptomRepository.findAll();
    }

    // DELETE - admin removes a mapping
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMapping(@PathVariable Long id) {
        symptomRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}