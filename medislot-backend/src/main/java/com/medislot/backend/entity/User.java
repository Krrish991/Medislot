package com.medislot.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // Existing project stores passwords as plain text for demo purposes.

    @Column(nullable = false, length = 255)
    private String securityQuestion;

    @Column(nullable = false, length = 64)
    private String securityAnswer; // SHA-256 hash of the normalized answer

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        PATIENT, DOCTOR, ADMIN
    }
}
