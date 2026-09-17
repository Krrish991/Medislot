package com.medislot.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * A physical clinic location. Doctors are attached to a clinic.
 * latitude/longitude are used for the "nearest doctor" map feature
 * (Haversine distance calculation in DoctorService).
 */
@Entity
@Table(name = "clinics")
@Data
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city; // e.g. Thane, Dadar, Borivali

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;
}
