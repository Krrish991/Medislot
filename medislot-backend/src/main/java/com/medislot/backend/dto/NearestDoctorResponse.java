package com.medislot.backend.dto;

import com.medislot.backend.entity.Doctor;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Wraps a Doctor together with the calculated distance (in km) from the
 * patient's current location — used by the "nearest clinic" map feature.
 * Also carries whether the doctor is available today, so the frontend
 * can show a green/red availability badge without an extra call.
 */
@Data
@AllArgsConstructor
public class NearestDoctorResponse {
    private Doctor doctor;
    private double distanceKm;
    private boolean availableToday;
}
