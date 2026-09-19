package com.medislot.backend.repository;

import com.medislot.backend.entity.DoctorClinicSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorClinicScheduleRepository extends JpaRepository<DoctorClinicSchedule, Long> {
    List<DoctorClinicSchedule> findByDoctorId(Long doctorId);
    List<DoctorClinicSchedule> findByDoctorIdAndDayOfWeek(Long doctorId, DoctorClinicSchedule.DayOfWeekEnum day);
}
