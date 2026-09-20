package com.medislot.backend.controller;

import com.medislot.backend.dto.ReviewRequest;
import com.medislot.backend.entity.Review;
import com.medislot.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // CREATE - patient submits a review after a completed appointment
    @PostMapping
    public ResponseEntity<?> addReview(@Valid @RequestBody ReviewRequest request) {
        try {
            Review review = reviewService.addReview(request);
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // READ - all reviews for a doctor + the average rating
    @GetMapping("/doctor/{doctorId}")
    public Map<String, Object> getDoctorReviews(@PathVariable Long doctorId) {
        List<Review> reviews = reviewService.getByDoctor(doctorId);
        double average = reviewService.getAverageRating(doctorId);
        return Map.of("reviews", reviews, "averageRating", average, "totalReviews", reviews.size());
    }
}
