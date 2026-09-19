package com.medislot.backend.repository;

import com.medislot.backend.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findBySpecializationIgnoreCase(String specialization);
    List<Doctor> findByVerifiedTrue();
    List<Doctor> findByVerifiedFalse();
    Optional<Doctor> findByUserId(Long userId);
}
