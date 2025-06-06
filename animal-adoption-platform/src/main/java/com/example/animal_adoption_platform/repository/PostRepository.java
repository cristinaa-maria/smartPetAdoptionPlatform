package com.example.animal_adoption_platform.repository;

import com.example.animal_adoption_platform.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PostRepository extends MongoRepository<Post, String> {
    Optional<Post> findById(String s);
    Optional<List<Post>> findPostBycreatedAt(LocalDateTime createdAt);
}
