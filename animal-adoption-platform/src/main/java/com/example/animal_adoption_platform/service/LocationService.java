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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
}
