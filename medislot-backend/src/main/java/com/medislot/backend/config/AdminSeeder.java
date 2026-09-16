package com.medislot.backend.config;

import com.medislot.backend.entity.User;
import com.medislot.backend.repository.UserRepository;
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
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);

            System.out.println("=================================================");
            System.out.println(" Default admin account created:");
            System.out.println("   email:    " + adminEmail);
            System.out.println("   password: admin123");
            System.out.println("=================================================");
        }
    }
}
