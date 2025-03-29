package com.example.animal_adoption_platform.service;

import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.UserRepository;
import com.example.animal_adoption_platform.dto.UserDTO;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Position;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public String registerUser(UserDTO user) {
        User newUser = new User();
        newUser.setName(user.getName());
        newUser.setEmail(user.getEmail());
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));

        User savedUser = userRepository.save(newUser);
        return savedUser.getId();
    }


    public Authentication loginUser(UserDTO user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent() && passwordEncoder.matches(user.getPassword(), existingUser.get().getPassword())) {
            User authenticatedUser = existingUser.get();

            Authentication auth = new UsernamePasswordAuthenticationToken(
                    authenticatedUser.getId(), null, List.of()
            );

            SecurityContextHolder.getContext().setAuthentication(auth);
            return auth;
        }
        return null;
    }


    public void updateUser(String id, String modifiedField, Object modifiedValue) {
        Optional<User> existingUser = userRepository.findById(id);

        if (existingUser.isPresent()) {
            User user = existingUser.get();

            switch (modifiedField) {
                case "name":
                    user.setName(modifiedValue.toString());
                    break;
                case "email":
                    user.setEmail(modifiedValue.toString());
                    break;
                case "password":
                    user.setPassword(modifiedValue.toString());
                    break;
                case "type":
                    user.setType(modifiedValue.toString());
                    break;
                case "contact":
                    user.setContact(modifiedValue.toString());
                    break;
                case "location":
                    if (modifiedValue instanceof GeoJsonPoint) {
                        user.setLocation((GeoJsonPoint) modifiedValue);
                    } else {
                        throw new IllegalArgumentException("Invalid location format");
                    }
                    break;
                default:
                    throw new IllegalArgumentException("Invalid field: " + modifiedField);
            }

            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found with id: " + id);
        }
    }

    public List<User> findUsersNearLocation(double latitude, double longitude, double radiusInKm) {
        double radiusInMeters = radiusInKm * 1000;
        Point locationPoint = new Point(new Position(longitude, latitude));

        return userRepository.findUsersNear(locationPoint, radiusInMeters);
    }

    public String getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getPrincipal().toString();
        }
        return null;
    }





}


