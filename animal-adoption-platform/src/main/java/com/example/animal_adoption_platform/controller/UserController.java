package com.example.animal_adoption_platform.controller;

import com.example.animal_adoption_platform.dto.UserDTO;
import com.example.animal_adoption_platform.service.UserService;
import com.mongodb.client.model.geojson.Point;
import org.springframework.http.HttpStatus;
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
    private Authentication authentication;

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
       authentication = userService.loginUser(user);
        if (authentication != null) {
            return ResponseEntity.ok("Login successful");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @GetMapping("/currentUserId")
    public ResponseEntity<?> getCurrentUserId() {
        String currentUserId = userService.getCurrentUserId(authentication);
        if (currentUserId != null) {
            return ResponseEntity.ok(currentUserId);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
    }

    @PatchMapping("/update-info")
    public ResponseEntity<String> updateUserInfo(
            @RequestBody Map<String, Object> updates) {
        String id = userService.getCurrentUserId(authentication);

        try {
            if (updates.containsKey("contact")) {
                userService.updateUser(id, "contact", updates.get("contact"));
            }
            if (updates.containsKey("type")) {
                userService.updateUser(id, "type", updates.get("type"));
            }

            return ResponseEntity.ok("User updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

}
