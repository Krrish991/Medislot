package com.medislot.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "doctors")
@Data
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Optional "default" clinic — kept for backward compatibility / doctors
    // with only one location. For doctors with multiple clinics, the real
    // source of truth is DoctorClinicSchedule (see that entity).
    @ManyToOne
    @JoinColumn(name = "clinic_id", nullable = true)
    private Clinic clinic;

    @Column(nullable = false)
    private String specialization;

    private String qualification;

    private Integer experienceYears;

    @Column(nullable = false)
    private Double consultationFee;

    // simple comma-separated days, e.g. "MON,WED,FRI"
    private String availableDays;

    @Column(nullable = false)
    private Boolean verified = false; // admin must approve new doctor registrations 
}
