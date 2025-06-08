package com.example.animal_adoption_platform.repository;


import com.example.animal_adoption_platform.model.Animal;

import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AnimalRepository extends MongoRepository<Animal, String> {
    Animal findAnimalById(String id);
    Animal findAnimalByName(String name);
    List<Animal> findByUserId(String userId);
    List<Animal> findBySpecies(String species);
    List<Animal> findByTypesOfAdoptions(List<String> typesOfAdoptions);

}
