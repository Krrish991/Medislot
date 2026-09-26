package com.medislot.backend.config;

import com.medislot.backend.entity.User;
import com.medislot.backend.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;


@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    public AdminSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@medislot.com";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName("MediSlot Admin");
            admin.setEmail(adminEmail);
            admin.setPassword("admin123"); 
            admin.setSecurityQuestion("What is the default administrator answer?");
            admin.setSecurityAnswer(hashAnswer("admin"));
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);

            System.out.println("=================================================");
            System.out.println(" Default admin account created:");
            System.out.println("   email:    " + adminEmail);
            System.out.println("   password: admin123");
            System.out.println("=================================================");
        }
    }

    private String hashAnswer(String answer) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(answer.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte value : digest) {
                result.append(String.format("%02x", value));
            }
            return result.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not create the default admin account", exception);
        }
    }
}
