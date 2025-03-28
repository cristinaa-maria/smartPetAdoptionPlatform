package com.example.animal_adoption_platform.repository;

import com.example.animal_adoption_platform.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findById(String id);
    Optional<User> findByName(String name);
    Optional<User> findByEmail(String email);
    Optional<User> findByPassword(String password);
}
