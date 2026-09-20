package com.medislot.backend.service;

import com.medislot.backend.dto.NearestDoctorResponse;
import com.medislot.backend.entity.Clinic;
import com.medislot.backend.entity.Doctor;
import com.medislot.backend.entity.DoctorClinicSchedule;
import com.medislot.backend.repository.DoctorClinicScheduleRepository;
import com.medislot.backend.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorClinicScheduleRepository scheduleRepository;

    public List<Doctor> getAllVerifiedDoctors() {
        return doctorRepository.findByVerifiedTrue();
    }

    public List<Doctor> getBySpecialization(String specialization) {
        return doctorRepository.findBySpecializationIgnoreCase(specialization);
        
    }
    // Doctors who registered but are not yet approved by admin
    public List<Doctor> getPendingDoctors() {
    return doctorRepository.findByVerifiedFalse();
        }

    public Doctor getById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
    }

    public Doctor save(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public void delete(Long id) {
        doctorRepository.deleteById(id);
    }

    public Doctor verifyDoctor(Long id) {
        Doctor doctor = getById(id);
        doctor.setVerified(true);
        return doctorRepository.save(doctor);
    }

    /**
     * ================================================================
     * FEATURE: Doctor at multiple clinics — "which clinic is the doctor
     * at RIGHT NOW" logic.
     * ----------------------------------------------------------------
     * A doctor can have several DoctorClinicSchedule rows (different
     * clinic on different days/times, e.g. Mon/Wed Thane, Tue/Thu Dadar).
     * This finds the row that matches today's day-of-week AND the
     * current clock time, and returns that clinic. If no schedule rows
     * exist at all, it falls back to the doctor's default `clinic` field
     * (kept for doctors with only one location).
     * ================================================================
     */
    public Optional<Clinic> getActiveClinicNow(Doctor doctor) {
        List<DoctorClinicSchedule> schedules = scheduleRepository.findByDoctorId(doctor.getId());

        if (schedules.isEmpty()) {
            return Optional.ofNullable(doctor.getClinic());
        }

        DayOfWeek today = LocalDate.now().getDayOfWeek();
        LocalTime now = LocalTime.now();
        DoctorClinicSchedule.DayOfWeekEnum todayEnum =
                DoctorClinicSchedule.DayOfWeekEnum.valueOf(today.name());

        return schedules.stream()
                .filter(s -> s.getDayOfWeek() == todayEnum)
                .filter(s -> !now.isBefore(s.getStartTime()) && !now.isAfter(s.getEndTime()))
                .findFirst()
                .map(DoctorClinicSchedule::getClinic)
                // not in an active slot right now, but still scheduled today somewhere
                .or(() -> schedules.stream()
                        .filter(s -> s.getDayOfWeek() == todayEnum)
                        .findFirst()
                        .map(DoctorClinicSchedule::getClinic))
                // not scheduled today at all — fall back to default clinic
                .or(() -> Optional.ofNullable(doctor.getClinic()));
    }

    /**
     * Is the doctor at a clinic (any clinic) at this exact moment, based on
     * their schedule? Used for the "Available Today" green/red badge.
     */
    public boolean isAvailableToday(Doctor doctor) {
        List<DoctorClinicSchedule> schedules = scheduleRepository.findByDoctorId(doctor.getId());
        DayOfWeek today = LocalDate.now().getDayOfWeek();
        DoctorClinicSchedule.DayOfWeekEnum todayEnum =
                DoctorClinicSchedule.DayOfWeekEnum.valueOf(today.name());

        if (!schedules.isEmpty()) {
            return schedules.stream().anyMatch(s -> s.getDayOfWeek() == todayEnum);
        }

        // fallback: legacy comma-separated availableDays field, e.g. "MON,WED,FRI"
        if (doctor.getAvailableDays() != null) {
            String shortDay = today.name().substring(0, 3); // "MON", "TUE", ...
            return doctor.getAvailableDays().toUpperCase().contains(shortDay);
        }
        return false;
    }

    /**
     * ================================================================
     * NEAREST-CLINIC MAP FEATURE
     * ----------------------------------------------------------------
     * Given the patient's current latitude/longitude, this returns every
     * verified doctor sorted by straight-line distance (nearest first),
     * using the Haversine formula — measured against whichever clinic
     * the doctor is actually AT right now (see getActiveClinicNow above),
     * not just a fixed default clinic.
     *
     * Example from the brief: a patient in Dombivli searching for a
     * doctor will see the Thane clinic ranked above the Dadar clinic,
     * because Thane is geographically closer — and if that same doctor
     * is at Dadar today instead of Thane, the distance shown reflects
     * TODAY's actual location, not a stale default.
     * ================================================================
     */
    public List<NearestDoctorResponse> getNearestDoctors(double patientLat, double patientLng, String specialization) {
        List<Doctor> doctors = (specialization == null || specialization.isBlank())
                ? doctorRepository.findByVerifiedTrue()
                : doctorRepository.findBySpecializationIgnoreCase(specialization);

        return doctors.stream()
                .map(doctor -> {
                    Clinic activeClinic = getActiveClinicNow(doctor).orElse(doctor.getClinic());
                    double distance = (activeClinic != null)
                            ? calculateDistanceKm(patientLat, patientLng, activeClinic.getLatitude(), activeClinic.getLongitude())
                            : Double.MAX_VALUE; // doctor has no clinic location at all — push to the end
                    return new NearestDoctorResponse(doctor, distance, isAvailableToday(doctor));
                })
                .sorted(Comparator.comparingDouble(NearestDoctorResponse::getDistanceKm))
                .collect(Collectors.toList());
    }

    /**
     * Haversine formula — calculates great-circle distance (in km) between
     * two lat/long points on Earth's surface.
     */
    public static double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        final double EARTH_RADIUS_KM = 6371.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;
        return Math.round(distance * 100.0) / 100.0; // round to 2 decimal places
    }
}
