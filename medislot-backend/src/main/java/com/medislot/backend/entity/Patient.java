package com.medislot.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "patients")
@Data
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String phone;

    private Integer age;

    private String gender;

    @Column(columnDefinition = "TEXT")
    private String medicalNotes;
}
