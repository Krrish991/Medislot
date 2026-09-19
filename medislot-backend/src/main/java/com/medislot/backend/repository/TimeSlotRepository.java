package com.medislot.backend.repository;

import com.medislot.backend.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findByDoctorIdAndSlotDateAndIsBookedFalse(Long doctorId, LocalDate slotDate);
}
