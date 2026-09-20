package com.medislot.backend.controller;

import com.medislot.backend.dto.ForgotPasswordRequest;
import com.medislot.backend.dto.LoginRequest;
import com.medislot.backend.dto.ResetPasswordRequest;
import com.medislot.backend.dto.RegisterRequest;
import com.medislot.backend.dto.AuthResponse;
import com.medislot.backend.entity.User;
import com.medislot.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // CREATE - register a new patient or doctor
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }


    // Get the security question for a registered email.
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            String question = authService.getSecurityQuestion(request);
            return ResponseEntity.ok(new SecurityQuestionResponse(question));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Verify the security answer and update the password in the database.
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // READ - login, returns user info 
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) { this.message = message; }
    }

    static class SecurityQuestionResponse {
        public String securityQuestion;
        public SecurityQuestionResponse(String securityQuestion) {
            this.securityQuestion = securityQuestion;
        }
    }

    static class MessageResponse {
        public String message;
        public MessageResponse(String message) { this.message = message; }
    }
}
