package com.medislot.backend.controller;

import com.medislot.backend.entity.Clinic;
import com.medislot.backend.repository.ClinicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    @Autowired
    private ClinicRepository clinicRepository;

    // CREATE
    @PostMapping
    public Clinic addClinic(@RequestBody Clinic clinic) {
        return clinicRepository.save(clinic);
    }

    // READ - all clinics 
    @GetMapping
    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    // READ - one clinic
    @GetMapping("/{id}")
    public ResponseEntity<Clinic> getById(@PathVariable Long id) {
        return clinicRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Clinic> updateClinic(@PathVariable Long id, @RequestBody Clinic updated) {
        return clinicRepository.findById(id).map(clinic -> {
            clinic.setName(updated.getName());
            clinic.setAddress(updated.getAddress());
            clinic.setCity(updated.getCity());
            clinic.setLatitude(updated.getLatitude());
            clinic.setLongitude(updated.getLongitude());
            return ResponseEntity.ok(clinicRepository.save(clinic));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClinic(@PathVariable Long id) {
        clinicRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
