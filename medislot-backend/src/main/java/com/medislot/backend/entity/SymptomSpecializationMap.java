package com.medislot.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Simple keyword -> specialization mapping, e.g. "fever" -> "General Physician",
 * "toothache" -> "Dentistry". Powers the symptom-based search box.
 */
@Entity
@Table(name = "symptom_specialization_map")
@Data
public class SymptomSpecializationMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String symptomKeyword; // lowercase, e.g. "fever"

    @Column(nullable = false)
    private String specialization; // e.g. "General Physician"
}
