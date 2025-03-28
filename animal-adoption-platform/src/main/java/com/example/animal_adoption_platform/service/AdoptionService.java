package com.example.animal_adoption_platform.service;

import com.example.animal_adoption_platform.dto.AdoptionDTO;
import com.example.animal_adoption_platform.model.Adoption;
import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.repository.AdoptionRepository;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AdoptionService {
    private AdoptionRepository adoptionRepository;
    private AnimalService animalService;

    public AdoptionService(AdoptionRepository adoptionRepository, AnimalRepository animalRepository, AnimalService animalService) {
        this.adoptionRepository = adoptionRepository;
        this.animalRepository = animalRepository;
        this.animalService = animalService;
    }

    private AnimalRepository animalRepository;

    public void scheduleAnAdoption(AdoptionDTO adoptionDTO) {
        Adoption adoption = new Adoption();
        adoption.setOwnerId(adoptionDTO.getOwnerId());
        adoption.setAnimalId(adoptionDTO.getAnimalId());
        adoption.setAdopterId(adoptionDTO.getAdopterId());
        adoption.setAdoptionDate(adoptionDTO.getScheduledDate());
        adoption.setStatus(adoptionDTO.getStatus());
        adoption.setType(adoptionDTO.getType());
        adoption.setPeriod(adoptionDTO.getPeriod());
        adoptionRepository.save(adoption);
    }

    public void changeStatus(String id, String status){

        Adoption adoption = adoptionRepository.findById(id).get();
        adoption.setStatus(status);
        adoptionRepository.save(adoption);
    }

    public void completeAdoption(AdoptionDTO adoptionDTO) {
        Adoption adoption = adoptionRepository.findById(adoptionDTO.getAdopterId()).get();
        if(adoption.getStatus().equalsIgnoreCase("completed") && adoption.getType().equalsIgnoreCase("permanentă")){
            Animal animal = animalRepository.findAnimalById(adoptionDTO.getAnimalId());
            animalService.deleteAnimal(animal.getId());

        }
        else{
            LocalDateTime endDate = adoption.getAdoptionDate().plusMonths(adoption.getPeriod());
            LocalDateTime currentDate = LocalDateTime.now();
            if(currentDate.minusMonths(endDate.getMonthValue()).equals(adoption.getPeriod())){
                Animal animal = animalRepository.findAnimalById(adoptionDTO.getAnimalId());
                animalService.deleteAnimal(animal.getId());
            }
        }

            adoptionRepository.delete(adoption);
    }

}
