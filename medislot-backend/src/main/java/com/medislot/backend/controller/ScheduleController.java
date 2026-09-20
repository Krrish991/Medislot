package com.medislot.backend.controller;

import com.medislot.backend.entity.Clinic;
import com.medislot.backend.entity.Doctor;
import com.medislot.backend.entity.DoctorClinicSchedule;
import com.medislot.backend.repository.ClinicRepository;
import com.medislot.backend.repository.DoctorClinicScheduleRepository;
import com.medislot.backend.repository.DoctorRepository;
import com.medislot.backend.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * Manages which clinic a doctor sits at on which day/time.
 * e.g. a doctor might be at Thane on Mon/Wed 10am-2pm and at
 * Dadar on Tue/Thu 4pm-8pm — each combination is one row here.
 */
@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired private DoctorClinicScheduleRepository scheduleRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private ClinicRepository clinicRepository;
    @Autowired private DoctorService doctorService;

    // CREATE - add a clinic slot to a doctor's weekly schedule
    @PostMapping
    public ResponseEntity<?> addSchedule(@RequestBody Map<String, String> body) {
        Doctor doctor = doctorRepository.findById(Long.parseLong(body.get("doctorId")))
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Clinic clinic = clinicRepository.findById(Long.parseLong(body.get("clinicId")))
                .orElseThrow(() -> new RuntimeException("Clinic not found"));

        DoctorClinicSchedule schedule = new DoctorClinicSchedule();
        schedule.setDoctor(doctor);
        schedule.setClinic(clinic);
        schedule.setDayOfWeek(DoctorClinicSchedule.DayOfWeekEnum.valueOf(body.get("dayOfWeek").toUpperCase()));
        schedule.setStartTime(LocalTime.parse(body.get("startTime")));
        schedule.setEndTime(LocalTime.parse(body.get("endTime")));

        return ResponseEntity.ok(scheduleRepository.save(schedule));
    }

    // READ - a doctor's full weekly schedule 
    @GetMapping("/doctor/{doctorId}")
    public List<DoctorClinicSchedule> getDoctorSchedule(@PathVariable Long doctorId) {
        return scheduleRepository.findByDoctorId(doctorId);
    }

    // READ - which clinic is this doctor AT RIGHT NOW (today's day + current time)
    @GetMapping("/doctor/{doctorId}/active-now")
    public ResponseEntity<?> getActiveClinicNow(@PathVariable Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return doctorService.getActiveClinicNow(doctor)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of("message", "This doctor has no clinic scheduled right now")));
    }

    // DELETE - remove a schedule slot
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
