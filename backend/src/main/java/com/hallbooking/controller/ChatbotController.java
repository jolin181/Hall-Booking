package com.hallbooking.controller;

import com.hallbooking.dto.ChatbotRequest;
import com.hallbooking.dto.ChatbotResponse;
import com.hallbooking.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/query")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ChatbotResponse> query(@Valid @RequestBody ChatbotRequest request) {
        ChatbotResponse response = chatbotService.processQuery(request.getMessage());
        return ResponseEntity.ok(response);
    }
}
