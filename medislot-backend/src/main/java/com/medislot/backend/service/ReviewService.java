package com.medislot.backend.service;

import com.medislot.backend.dto.ReviewRequest;
import com.medislot.backend.entity.Appointment;
import com.medislot.backend.entity.Review;
import com.medislot.backend.repository.AppointmentRepository;
import com.medislot.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.OptionalDouble;

@Service
public class ReviewService {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private AppointmentRepository appointmentRepository;

    public Review addReview(ReviewRequest req) {
        Appointment appointment = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() != Appointment.Status.COMPLETED) {
            throw new RuntimeException("You can only review a completed appointment");
        }

        Review review = new Review();
        review.setAppointment(appointment);
        review.setDoctor(appointment.getDoctor());
        review.setPatient(appointment.getPatient());
        review.setRating(req.getRating());
        review.setComment(req.getComment());

        return reviewRepository.save(review);
    }

    public List<Review> getByDoctor(Long doctorId) {
        return reviewRepository.findByDoctorId(doctorId);
    }

    public double getAverageRating(Long doctorId) {
        List<Review> reviews = reviewRepository.findByDoctorId(doctorId);
        OptionalDouble avg = reviews.stream().mapToInt(Review::getRating).average();
        return avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : 0.0;
    }
}
