package com.medislot.backend.repository;

import com.medislot.backend.entity.SymptomSpecializationMap;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SymptomSpecializationMapRepository extends JpaRepository<SymptomSpecializationMap, Long> {
    Optional<SymptomSpecializationMap> findBySymptomKeywordIgnoreCase(String keyword);
    List<SymptomSpecializationMap> findBySymptomKeywordContainingIgnoreCase(String partialKeyword);
}
