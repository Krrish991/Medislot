
package com.medislot.backend.service;
import com.medislot.backend.dto.AppointmentRequest;
import com.medislot.backend.entity.Appointment;
import com.medislot.backend.entity.Doctor;
import com.medislot.backend.entity.Patient;
import com.medislot.backend.entity.TimeSlot;
import com.medislot.backend.repository.AppointmentRepository;
import com.medislot.backend.repository.DoctorRepository;
import com.medislot.backend.repository.PatientRepository;
import com.medislot.backend.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private TimeSlotRepository timeSlotRepository;

    // CREATE 
    public Appointment bookAppointment(AppointmentRequest req) {
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Doctor doctor = doctorRepository.findById(req.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        TimeSlot slot = timeSlotRepository.findById(req.getSlotId())
                .orElseThrow(() -> new RuntimeException("Time slot not found"));

        if (Boolean.TRUE.equals(slot.getIsBooked())) {
            throw new RuntimeException("This time slot is already booked. Please choose another slot.");
        }

        slot.setIsBooked(true);
        timeSlotRepository.save(slot);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSlot(slot);
        appointment.setReason(req.getReason());
        appointment.setStatus(Appointment.Status.PENDING);

        return appointmentRepository.save(appointment);
    }

    // ---------- READ ----------
    public List<Appointment> getByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment getById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    // ---------- UPDATE ----------
    public Appointment updateStatus(Long id, String status) {
        Appointment appointment = getById(id);
        Appointment.Status newStatus = Appointment.Status.valueOf(status.toUpperCase());
        appointment.setStatus(newStatus);

        // if cancelled, free up the slot again
        if (newStatus == Appointment.Status.CANCELLED) {
            TimeSlot slot = appointment.getSlot();
            slot.setIsBooked(false);
            timeSlotRepository.save(slot);
        }
        return appointmentRepository.save(appointment);
    }

    // ---------- DELETE ----------
    public void cancelAndDelete(Long id) {
        Appointment appointment = getById(id);
        TimeSlot slot = appointment.getSlot();
        slot.setIsBooked(false);
        timeSlotRepository.save(slot);
        appointmentRepository.deleteById(id);
    }
}
