package com.example.animal_adoption_platform.controller;

import com.example.animal_adoption_platform.dto.AnimalDTO;
import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.service.AnimalService;
import com.example.animal_adoption_platform.service.UserService;
import com.mongodb.client.model.geojson.Point;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Controller
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdoptionPostController {
    private final AnimalRepository animalRepository;
    private AnimalService animalService;
    private UserService userService;
    private Authentication authentication;

    public AdoptionPostController(AnimalService animalService, AnimalRepository animalRepository, UserService userService) {
        this.animalService = animalService;
        this.animalRepository = animalRepository;
        this.userService = userService;
    }

    @PostMapping("/createAnimal")
    public ResponseEntity<String> createAnimal(@RequestBody AnimalDTO animalDTO) {
        animalService.addAnimal(animalDTO);
        return ResponseEntity.ok("Created successfully");
    }

    @DeleteMapping("/deleteAnimal/{id}")
    public ResponseEntity<String> deleteAnimal(@PathVariable String id) {
        animalService.deleteAnimal(id);
        return ResponseEntity.ok("Deleted successfully");
    }
    @PatchMapping("/updateAnimal/{id}")
    public ResponseEntity<String> updateAnimal(
            @PathVariable String id,
            @RequestBody Map<String, String> updates) {

        if (updates.size() != 1) {
            return ResponseEntity.badRequest().body("Please provide exactly one field to update");
        }

        Map.Entry<String, String> entry = updates.entrySet().iterator().next();
        String field = entry.getKey();
        String value = entry.getValue();

        try {
            animalService.updateAnimal(id, field, value);
            return ResponseEntity.ok("Updated successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
//
//    @GetMapping("/locations")
//    public ResponseEntity<List<String>> getLocations() {
//        List<Animal> animals = animalService.getAnimals();
//        List<String> locations = new ArrayList<>();
//        for(Animal animal : animals) {
//            locations.add(animal.getLocation().toString());
//        }
//        return ResponseEntity.ok(locations);
//    }

    @GetMapping("/animalCatalog")
    public ResponseEntity<List<Animal>> getAnimals(String userId){
        List<Animal> animals = animalService.getAnimalsByUserId(userId);
        return ResponseEntity.ok(animals);
    }

 






}
