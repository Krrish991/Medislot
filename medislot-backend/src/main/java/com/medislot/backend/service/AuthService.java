package com.medislot.backend.service;

import com.medislot.backend.dto.ForgotPasswordRequest;
import com.medislot.backend.dto.LoginRequest;
import com.medislot.backend.dto.RegisterRequest;
import com.medislot.backend.dto.AuthResponse;
import com.medislot.backend.dto.ResetPasswordRequest;
import com.medislot.backend.dto.VerifyEmailRequest;
import com.medislot.backend.entity.*;
import com.medislot.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private ClinicRepository clinicRepository;
    @Autowired private EmailService emailService;
    @Value("${google.client-id:}")
    private String googleClientId;
    private final SecureRandom random = new SecureRandom();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public AuthResponse googleLogin(String accessToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new RuntimeException("Google login is not configured");
        }

        String email;
        String name;
        try {
            String encodedToken = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
            HttpRequest tokenInfoRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?access_token=" + encodedToken))
                    .build();
            HttpResponse<String> tokenInfoResponse = httpClient.send(
                    tokenInfoRequest, HttpResponse.BodyHandlers.ofString());
            if (tokenInfoResponse.statusCode() < 200 || tokenInfoResponse.statusCode() >= 300) {
                throw new RuntimeException("Invalid Google sign-in");
            }

            JsonNode tokenInfo = objectMapper.readTree(tokenInfoResponse.body());
            String audience = tokenInfo.path("aud").asText("");
            String authorizedParty = tokenInfo.path("azp").asText("");
            if (!googleClientId.equals(audience) && !googleClientId.equals(authorizedParty)) {
                throw new RuntimeException("Invalid Google sign-in");
            }

            email = tokenInfo.path("email").asText("");
            JsonNode emailVerified = tokenInfo.get("email_verified");
            boolean isEmailVerified = emailVerified != null
                    && (emailVerified.isBoolean() && emailVerified.booleanValue()
                    || emailVerified.isTextual() && "true".equalsIgnoreCase(emailVerified.textValue()));
            if (email.isBlank() || !isEmailVerified) {
                throw new RuntimeException("Your Google email is not verified");
            }

            name = email;
            try {
                HttpRequest userInfoRequest = HttpRequest.newBuilder()
                        .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                        .header("Authorization", "Bearer " + accessToken)
                        .GET()
                        .build();
                HttpResponse<String> userInfoResponse = httpClient.send(
                        userInfoRequest, HttpResponse.BodyHandlers.ofString());
                if (userInfoResponse.statusCode() >= 200 && userInfoResponse.statusCode() < 300) {
                    String returnedName = objectMapper.readTree(userInfoResponse.body()).path("name").asText("");
                    if (!returnedName.isBlank()) name = returnedName;
                }
            } catch (Exception ignored) {
                // Userinfo is optional; the verified email is a safe fallback name.
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Could not verify Google sign-in", e);
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            User newUser = new User();
            newUser.setName(name);
            newUser.setEmail(email);
            newUser.setPassword(UUID.randomUUID().toString());
            newUser.setSecurityQuestion("Signed up with Google");
            newUser.setSecurityAnswer(hashAnswer(UUID.randomUUID().toString()));
            newUser.setRole(User.Role.PATIENT);
            newUser.setEmailVerified(true);
            user = userRepository.save(newUser);

            Patient patient = new Patient();
            patient.setUser(user);
            patientRepository.save(patient);
        } else if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user.setVerificationCode(null);
            user.setVerificationExpiry(null);
            user.setVerificationAttempts(0);
            user = userRepository.save(user);
        }

        return buildLoginResponse(user);
    }

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
        user.setEmailVerified(false);
        user.setVerificationCode(newCode());
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));
        user.setVerificationAttempts(0);
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

        try {
            emailService.sendVerificationCode(savedUser.getEmail(), savedUser.getName(), savedUser.getVerificationCode());
        } catch (RuntimeException e) {
            System.err.println("Could not send verification email: " + e.getMessage());
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
        if (!user.isEmailVerified()) {
            throw new RuntimeException("EMAIL_NOT_VERIFIED");
        }
        return buildLoginResponse(user);
    }

    private AuthResponse buildLoginResponse(User user) {
        Long patientId = null;
        Long doctorId = null;
        if (user.getRole() == User.Role.PATIENT) {
            patientId = patientRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Patient profile not found"))
                    .getId();
        } else if (user.getRole() == User.Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
            if (!Boolean.TRUE.equals(doctor.getVerified())) {
                throw new RuntimeException(
                        "Your account is pending admin approval. You can log in once the admin verifies your profile.");
            }
            doctorId = doctor.getId();
        }
        return toAuthResponse(user, patientId, doctorId);
    }

    public void verifyEmail(VerifyEmailRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("No account was found with this email"));

        if (user.isEmailVerified()) return;

        LocalDateTime now = LocalDateTime.now();
        if (user.getVerificationCode() == null || user.getVerificationExpiry() == null
                || now.isAfter(user.getVerificationExpiry())) {
            throw new RuntimeException("Code expired. Please request a new one");
        }
        if (user.getVerificationAttempts() >= 5) {
            throw new RuntimeException("Too many wrong attempts. Please request a new code");
        }

        boolean matches = MessageDigest.isEqual(
                req.getCode().trim().getBytes(StandardCharsets.UTF_8),
                user.getVerificationCode().getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            user.setVerificationAttempts(user.getVerificationAttempts() + 1);
            userRepository.save(user);
            throw new RuntimeException("Incorrect code");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        user.setVerificationAttempts(0);
        userRepository.save(user);
    }

    public void resendCode(String email) {
        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("No account was found with this email"));
        if (user.isEmailVerified()) throw new RuntimeException("Email is already verified");

        LocalDateTime now = LocalDateTime.now();
        if (user.getVerificationExpiry() != null && now.isBefore(user.getVerificationExpiry().minusMinutes(9))) {
            throw new RuntimeException("Please wait a minute before requesting another code");
        }

        user.setVerificationCode(newCode());
        user.setVerificationExpiry(now.plusMinutes(10));
        user.setVerificationAttempts(0);
        userRepository.save(user);
        emailService.sendVerificationCode(user.getEmail(), user.getName(), user.getVerificationCode());
    }

    private String newCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private AuthResponse toAuthResponse(User user, Long patientId, Long doctorId) {
        return new AuthResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), patientId, doctorId);
    }
}
