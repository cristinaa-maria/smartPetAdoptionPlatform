package com.example.animal_adoption_platform.service;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;
import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class LocationService {

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;

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

    public List<String> searchClinicsInBoundingBox(double latMin, double latMax,
                                                   double lonMin, double lonMax,
                                                   String keyword) {
        List<String> vetClinics = new ArrayList<>();
        try {
            if (latMin > latMax) {
                double temp = latMin;
                latMin = latMax;
                latMax = temp;
            }
            if (lonMin > lonMax) {
                double temp = lonMin;
                lonMin = lonMax;
                lonMax = temp;
            }

            System.out.println("=== CLINIC SEARCH DEBUG (Backend) ===");
            System.out.println("Bounding box: latMin=" + latMin + ", latMax=" + latMax +
                    ", lonMin=" + lonMin + ", lonMax=" + lonMax);
            System.out.println("Keyword: " + keyword);

            // 2. Construim URL corect pentru viewbox
            String searchUrl = String.format(
                    "https://nominatim.openstreetmap.org/search?q=%s&format=json&bounded=1&viewbox=%f,%f,%f,%f&limit=50&countrycodes=ro",
                    URLEncoder.encode(keyword, "UTF-8"),
                    lonMin, latMax, lonMax, latMin // left, top, right, bottom
            );

            System.out.println("Search URL: " + searchUrl);

            // 3. Trimitem request
            JSONArray results = sendGetRequestArray(searchUrl);
            System.out.println("Raw results count: " + results.length());

            // 4. Parcurgem rezultatele și returnăm doar numele (fără coordonate)
            for (int i = 0; i < results.length(); i++) {
                JSONObject obj = results.getJSONObject(i);
                String displayName = obj.optString("display_name", "");

                // Filtrăm doar rezultatele care par să fie clinici veterinare
                if (displayName.toLowerCase().contains("veterinar") ||
                        displayName.toLowerCase().contains("vet") ||
                        displayName.toLowerCase().contains("clinica")) {

                    // Returnăm doar numele fără coordonate
                    vetClinics.add(displayName);
                    System.out.println("Added clinic: " + displayName);
                }
            }

            System.out.println("Filtered clinics count: " + vetClinics.size());

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error searching clinics: " + e.getMessage());
            vetClinics.add("Eroare la căutarea clinicilor: " + e.getMessage());
        }

        return vetClinics;
    }

    private JSONArray sendGetRequestArray(String urlString) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlString).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("User-Agent", "VetClinicFinder/1.0");

        // Add delay to respect rate limits
        Thread.sleep(100);

        int responseCode = conn.getResponseCode();
        System.out.println("Nominatim response code: " + responseCode);

        if (responseCode != 200) {
            throw new Exception("HTTP Error: " + responseCode);
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder resultStr = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            resultStr.append(line);
        }
        reader.close();

        return new JSONArray(resultStr.toString());
    }
}