package com.example.animal_adoption_platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Position;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class LocationService {
    private final UserService userService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${locationiq.api.key}")
    private String locationIqApiKey;

    public LocationService(UserService userService, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.userService = userService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public void updateUserLocationFromAddress(String userId, String address) {
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8.toString());

            String url = "https://us1.locationiq.com/v1/search.php?key=" + locationIqApiKey +
                    "&q=" + encodedAddress + "&format=json";

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonArray = objectMapper.readTree(response.getBody());

                if (jsonArray.isArray() && jsonArray.size() > 0) {
                    JsonNode locationData = jsonArray.get(0);
                    double lat = locationData.get("lat").asDouble();
                    double lon = locationData.get("lon").asDouble();

                    GeoJsonPoint locationPoint = new GeoJsonPoint(lon, lat);

                    userService.updateUser(userId, "location", locationPoint);
                } else {
                    throw new RuntimeException("No location data found for address: " + address);
                }
            } else {
                throw new RuntimeException("Error fetching data from LocationIQ");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user location: " + e.getMessage());
        }
    }

    public String getAddressFromCoordinates(double latitude, double longitude) {
        try {
            String url = "https://us1.locationiq.com/v1/reverse.php?key=" + locationIqApiKey +
                    "&lat=" + latitude + "&lon=" + longitude + "&format=json";

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());

                if (jsonNode.has("display_name")) {
                    return jsonNode.get("display_name").asText();
                } else {
                    throw new RuntimeException("No address found for coordinates.");
                }
            } else {
                throw new RuntimeException("Error fetching address from LocationIQ");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to get address: " + e.getMessage());
        }
    }

    public List<String> getNearbyVetClinicNames(double latitude, double longitude) {
        RestTemplate restTemplate = new RestTemplate();

        // Crearea unui query simplu cu "+" pentru spații
        String query = "veterinary clinic near " + latitude + "," + longitude;

        // Construirea URL-ului corect cu "+" pentru spații
        String url = "https://us1.locationiq.com/v1/search.php?key=" + locationIqApiKey +
                "&q=" + query.replace(" ", "+") + // înlocuirea spațiilor cu "+"
                "&format=json" +
                "&limit=5"; // Limitați la 5 rezultate pentru mai multă claritate

        // Obținerea răspunsului de la API
        List<Map<String, Object>> response = restTemplate.getForObject(url, List.class);
        if (response == null || response.isEmpty()) return List.of();

        return response.stream()
                .map(place -> (String) place.getOrDefault("display_name", "Unknown Clinic"))
                .toList();
    }


}
