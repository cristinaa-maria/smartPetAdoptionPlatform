package com.example.animal_adoption_platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class LocationService {

    @Autowired
    private UserService userService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Updatează locația unui utilizator pe baza adresei (folosind Nominatim OpenStreetMap).
     */
    public void updateUserLocationFromAddress(String userId, String address) {
        try {
            String url = "https://nominatim.openstreetmap.org/search?format=json&q=" + address;

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "animal-platform/0.1 (contact@yourdomain.com)");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (resp.getStatusCode() != HttpStatus.OK || resp.getBody() == null) {
                throw new RuntimeException("Eroare la interogarea Nominatim: " + resp.getStatusCode());
            }

            JsonNode arr = mapper.readTree(resp.getBody());
            if (!arr.isArray() || arr.size() == 0) {
                throw new RuntimeException("Nicio locație găsită pentru: " + address);
            }
            JsonNode first = arr.get(0);
            double lat = first.get("lat").asDouble();
            double lon = first.get("lon").asDouble();

            GeoJsonPoint point = new GeoJsonPoint(lon, lat);
            userService.updateUser(userId, "location", point);

        } catch (Exception e) {
            throw new RuntimeException("Eroare geocodare: " + e.getMessage(), e);
        }
    }

    /**
     * Obține adresa umană din coordonate (reverse geocoding).
     */
    public String getAddressFromCoordinates(double latitude, double longitude) {
        try {
            String url = String.format(
                    "https://nominatim.openstreetmap.org/reverse?format=json&lat=%s&lon=%s",
                    latitude, longitude
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "animal-platform/0.1 (contact@yourdomain.com)");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (resp.getStatusCode() != HttpStatus.OK || resp.getBody() == null) {
                throw new RuntimeException("Eroare la reverse geocoding: " + resp.getStatusCode());
            }

            JsonNode root = mapper.readTree(resp.getBody());
            return root.path("display_name").asText("Adresă necunoscută");

        } catch (Exception e) {
            throw new RuntimeException("Eroare reverse geocoding: " + e.getMessage(), e);
        }
    }

    /**
     * Returnează lista de clinici veterinare apropiate (exemplu - implementare dummy, modifică după nevoie).
     */
    public List<String> getNearbyVetClinicNames(double latitude, double longitude) {
        // Aici poți folosi Overpass API, sau poți implementa logică custom.
        // Exemplu simplu (mock):
        return List.of("Clinica Vet1", "Clinica Vet2");
    }

    // Orice alte metode ai mai avea, păstrează-le aici cu aceeași semnătură ca înainte!
    // public <Tip> metodaTa(...) { ... }
}
