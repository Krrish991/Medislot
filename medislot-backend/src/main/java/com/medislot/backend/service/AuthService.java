package com.medislot.backend.service;

import com.medislot.backend.dto.ForgotPasswordRequest;
import com.medislot.backend.dto.LoginRequest;
import com.medislot.backend.dto.RegisterRequest;
import com.medislot.backend.dto.AuthResponse;
import com.medislot.backend.dto.ResetPasswordRequest;
import com.medislot.backend.entity.*;
import com.medislot.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private ClinicRepository clinicRepository;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("An account with this email already exists");
        }

        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword()); // Keep existing project password storage unchanged.
        user.setSecurityQuestion(req.getSecurityQuestion());
        user.setSecurityAnswer(hashAnswer(req.getSecurityAnswer()));
        user.setRole(User.Role.valueOf(req.getRole().toUpperCase()));
        User savedUser = userRepository.save(user);

        Long patientId = null;
        Long doctorId = null;

        if (savedUser.getRole() == User.Role.PATIENT) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            Patient savedPatient = patientRepository.save(patient);
            patientId = savedPatient.getId();
        } else if (savedUser.getRole() == User.Role.DOCTOR) {
            Clinic clinic = clinicRepository.findById(req.getClinicId())
                    .orElseThrow(() -> new RuntimeException("Selected clinic not found"));

            Doctor doctor = new Doctor();
            doctor.setUser(savedUser);
            doctor.setClinic(clinic);
            doctor.setSpecialization(req.getSpecialization());
            doctor.setQualification(req.getQualification());
            doctor.setExperienceYears(req.getExperienceYears());
            doctor.setConsultationFee(req.getConsultationFee());
            doctor.setVerified(false); // admin must verify before doctor appears in search
            Doctor savedDoctor = doctorRepository.save(doctor);
            doctorId = savedDoctor.getId();
        }

        return toAuthResponse(savedUser, patientId, doctorId);
    }

    public String getSecurityQuestion(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("No account was found with this email"));

        return user.getSecurityQuestion();
    }

    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("No account was found with this email"));

        String suppliedAnswerHash = hashAnswer(req.getSecurityAnswer());
        if (!MessageDigest.isEqual(
                suppliedAnswerHash.getBytes(StandardCharsets.UTF_8),
                user.getSecurityAnswer().getBytes(StandardCharsets.UTF_8))) {
            throw new RuntimeException("Incorrect security answer");
        }

        user.setPassword(req.getNewPassword());
        userRepository.save(user);
    }

    private String hashAnswer(String answer) {
        try {
            String normalized = answer == null ? "" : answer.trim().toLowerCase();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            throw new RuntimeException("Could not process security answer");
        }
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.getPassword().equals(req.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        Long patientId = null;
        Long doctorId = null;
        if (user.getRole() == User.Role.PATIENT) {
            patientId = patientRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Patient profile not found"))
                    .getId();
        } else if (user.getRole() == User.Role.DOCTOR) {
            doctorId = doctorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Doctor profile not found"))
                    .getId();
        }
        return toAuthResponse(user, patientId, doctorId);
    }

    private AuthResponse toAuthResponse(User user, Long patientId, Long doctorId) {
        return new AuthResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), patientId, doctorId);
    }
}
