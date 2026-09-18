package com.medislot.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;

/**
 * A doctor can visit multiple clinics on different days/times
 * (e.g. Mon/Wed at Thane 10am-2pm, Tue/Thu at Dadar 4pm-8pm).
 * One row here = one (doctor, clinic, day, time-range) slot.
 */
@Entity
@Table(name = "doctor_clinic_schedule")
@Data
public class DoctorClinicSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeekEnum dayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    public enum DayOfWeekEnum {
        MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
    }
}
