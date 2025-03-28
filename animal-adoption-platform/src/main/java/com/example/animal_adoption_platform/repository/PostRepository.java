package com.example.animal_adoption_platform.repository;

import com.example.animal_adoption_platform.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PostRepository extends MongoRepository<Post, String> {
    Optional<Post> findById(String s);
}
