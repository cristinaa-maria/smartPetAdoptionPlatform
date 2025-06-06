package com.example.animal_adoption_platform.repository;


import com.example.animal_adoption_platform.model.RDF2VecEmbeddings;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RDF2VecEmbeddingsRepository extends MongoRepository<RDF2VecEmbeddings, String> {
    Optional<RDF2VecEmbeddings> findById(String id);
    Optional<RDF2VecEmbeddings> findByAnimalId(String animalId);

}
