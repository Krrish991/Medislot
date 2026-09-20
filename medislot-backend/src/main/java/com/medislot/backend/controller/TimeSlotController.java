package com.medislot.backend.controller;

import com.medislot.backend.entity.Doctor;
import com.medislot.backend.entity.TimeSlot;
import com.medislot.backend.repository.DoctorRepository;
import com.medislot.backend.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/slots")
public class TimeSlotController {

    @Autowired private TimeSlotRepository timeSlotRepository;
    @Autowired private DoctorRepository doctorRepository;

    // CREATE - doctor adds a new available time slot
    @PostMapping
    public ResponseEntity<?> addSlot(@RequestBody Map<String, String> body) {
        Doctor doctor = doctorRepository.findById(Long.parseLong(body.get("doctorId")))
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        TimeSlot slot = new TimeSlot();
        slot.setDoctor(doctor);
        slot.setSlotDate(LocalDate.parse(body.get("date")));
        slot.setSlotTime(java.time.LocalTime.parse(body.get("time")));
        slot.setIsBooked(false);

        return ResponseEntity.ok(timeSlotRepository.save(slot));
    }

    // READ - available (not booked) slots for a doctor on a given date
    @GetMapping("/doctor/{doctorId}")
    public List<TimeSlot> getAvailableSlots(@PathVariable Long doctorId, @RequestParam String date) {
        return timeSlotRepository.findByDoctorIdAndSlotDateAndIsBookedFalse(doctorId, LocalDate.parse(date));
    }

    // DELETE - doctor removes an unbooked slot
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        timeSlotRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
