package com.medislot.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api-key:}")
    private String apiKey;

    @Value("${brevo.sender-email:}")
    private String senderEmail;

    @Value("${brevo.sender-name:MediSlot}")
    private String senderName;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendVerificationCode(String toEmail, String toName, String code) {
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("[DEV] Verification code for " + toEmail + ": " + code);
            return;
        }

        try {
            String safeName = HtmlUtils.htmlEscape(toName == null ? "" : toName);
            String htmlContent = "<p>Hello " + safeName + ",</p>"
                    + "<p>Your MediSlot verification code is:</p>"
                    + "<p style=\"font-size:32px;font-weight:bold;letter-spacing:4px\">" + code + "</p>"
                    + "<p>This code expires in 10 minutes.</p>";
            Map<String, Object> body = Map.of(
                    "sender", Map.of("name", senderName, "email", senderEmail),
                    "to", List.of(Map.of("email", toEmail, "name", toName == null ? "" : toName)),
                    "subject", "Your MediSlot verification code",
                    "htmlContent", htmlContent);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Brevo returned status " + response.statusCode() + ": " + response.body());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Could not send verification email", e);
        }
    }
}
