package com.example.animal_adoption_platform.controller;

import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.service.LocationService;
import com.example.animal_adoption_platform.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class LocationController {
    @Autowired
    private final LocationService locationService;
    private final UserService userService;

    public LocationController(LocationService locationService, UserService userService) {
        this.locationService = locationService;
        this.userService = userService;
    }

    @PostMapping("/{userId}/update-location")
    public ResponseEntity<String> updateUserLocation(@PathVariable String userId, @RequestBody Map<String, String> requestBody) {
        try {
            String address = requestBody.get("location");
            if (address == null || address.isEmpty()) {
                return ResponseEntity.badRequest().body("Address is required!");
            }

            locationService.updateUserLocationFromAddress(userId, address);
            return ResponseEntity.ok("Location updated successfully for user: " + userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating location: " + e.getMessage());
        }
    }

    @PostMapping("/nearby")
    public ResponseEntity<List<String>> getUsersNearby(@RequestBody Map<String, Object> requestBody) {
        try {
            double latitude = (double) requestBody.get("latitude");
            double longitude = (double) requestBody.get("longitude");
            double radiusInKm = (double) requestBody.get("radius");

            List<String> users = userService.findUsersNearLocation(latitude, longitude, radiusInKm);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(List.of(e.getMessage()));
        }
    }

    @GetMapping("/reverse-geocode")
    public ResponseEntity<String> getAddressFromCoordinates(@RequestParam double latitude, @RequestParam double longitude) {
        try {
            String address = locationService.getAddressFromCoordinates(latitude, longitude);
            return ResponseEntity.ok(address);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching address: " + e.getMessage());
        }
    }

    @PostMapping("/nearbyClinics")
    public ResponseEntity<List<String>> getNearbyClinics(@RequestBody Map<String, Object> requestBody) {
        try {
            double latMin = ((Number) requestBody.get("latMin")).doubleValue();
            double latMax = ((Number) requestBody.get("latMax")).doubleValue();
            double lonMin = ((Number) requestBody.get("lonMin")).doubleValue();
            double lonMax = ((Number) requestBody.get("lonMax")).doubleValue();
            String query = requestBody.getOrDefault("query", "clinica veterinara").toString();

            List<String> clinics = locationService.searchClinicsInBoundingBox(latMin, latMax, lonMin, lonMax, query);
            return ResponseEntity.ok(clinics);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(List.of("Eroare: " + e.getMessage()));
        }
    }
}
