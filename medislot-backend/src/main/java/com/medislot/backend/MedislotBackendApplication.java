package com.medislot.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MedislotBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(MedislotBackendApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" MediSlot backend running at http://localhost:8080");
        System.out.println("=================================================");
    }
}
