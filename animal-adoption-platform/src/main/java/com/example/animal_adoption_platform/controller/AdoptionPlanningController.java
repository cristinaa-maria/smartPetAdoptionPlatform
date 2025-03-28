package com.example.animal_adoption_platform.controller;

import com.example.animal_adoption_platform.dto.AdoptionDTO;
import com.example.animal_adoption_platform.repository.AdoptionRepository;
import com.example.animal_adoption_platform.repository.UserRepository;
import com.example.animal_adoption_platform.service.AdoptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdoptionPlanningController {
    AdoptionService adoptionService;

    public AdoptionPlanningController(AdoptionService adoptionService) {
        this.adoptionService = adoptionService;
    }

    @PostMapping("/scheduleAdoption")
    public ResponseEntity<String> scheduleAdoption(@RequestBody AdoptionDTO adoptionDTO){
        adoptionService.scheduleAnAdoption(adoptionDTO);
        return ResponseEntity.ok("Success");
    }

    @PatchMapping("/modifyStatus/{id}")
    public ResponseEntity<String> modifyStatus(@PathVariable String id, @RequestBody String status){
        adoptionService.changeStatus(id, status);
        return ResponseEntity.ok("Status changed successfully");
    }

    @DeleteMapping("/finishAdoption")
    public ResponseEntity<String> finishAdoption(@RequestBody AdoptionDTO adoptionDTO){
        adoptionService.completeAdoption(adoptionDTO);
        return ResponseEntity.ok("Adoption finished successfully");
    }


}
