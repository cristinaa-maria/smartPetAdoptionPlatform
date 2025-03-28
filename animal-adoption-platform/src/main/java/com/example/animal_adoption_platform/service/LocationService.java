package com.example.animal_adoption_platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Position;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

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
            // 1. Construim URL-ul pentru API LocationIQ
            String url = "https://us1.locationiq.com/v1/search.php?key=" + locationIqApiKey +
                    "&q=" + address + "&format=json";

            // 2. Facem request-ul către LocationIQ
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // 3. Parsăm JSON-ul folosind Jackson
                JsonNode jsonArray = objectMapper.readTree(response.getBody());

                if (jsonArray.isArray() && jsonArray.size() > 0) {
                    JsonNode locationData = jsonArray.get(0); // Luăm primul rezultat
                    double lat = locationData.get("lat").asDouble();
                    double lon = locationData.get("lon").asDouble();

                    // 4. Convertim în obiect Point pentru MongoDB
                    Point locationPoint = new Point(new Position(lon, lat));

                    // 5. Apelăm metoda updateUser din UserService
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

}
