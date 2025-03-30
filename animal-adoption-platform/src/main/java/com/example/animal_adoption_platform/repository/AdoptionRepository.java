package com.example.animal_adoption_platform.repository;

import com.example.animal_adoption_platform.model.Adoption;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AdoptionRepository extends MongoRepository<Adoption, String> {
    Optional<Adoption> findById(String id);
    Adoption findAdoptionByUserId(String s);
}
