package com.example.animal_adoption_platform.controller;

import com.example.animal_adoption_platform.dto.UserDTO;
import com.example.animal_adoption_platform.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

    private final UserService userService;
    private String userId;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserDTO user) {
        String userId = userService.registerUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("message", "User registered successfully");
        return ResponseEntity.ok().body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody UserDTO user) {
        userId = userService.loginUser(user);
        if (userId != null) {
            return ResponseEntity.ok("Login successful");
        }
        return ResponseEntity.status(401).body("Invalid credentials");

    }

    @GetMapping("/currentUser")
    public String getCurrentUser() {
        return userId;
    }


}
