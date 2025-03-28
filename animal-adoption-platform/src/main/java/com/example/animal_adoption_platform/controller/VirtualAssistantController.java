package com.example.animal_adoption_platform.controller;

import com.example.animal_adoption_platform.service.VirtualAssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VirtualAssistantController {
    private VirtualAssistantService virtualAssistant;

    public VirtualAssistantController(VirtualAssistantService virtualAssistant) {
        this.virtualAssistant = virtualAssistant;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody String prompt) {
        String response = virtualAssistant.generateText(prompt);
        return ResponseEntity.ok(response);
    }
}
