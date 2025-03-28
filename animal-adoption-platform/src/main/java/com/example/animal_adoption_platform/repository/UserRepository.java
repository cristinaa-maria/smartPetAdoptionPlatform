package com.example.animal_adoption_platform.repository;

import com.example.animal_adoption_platform.model.User;
import com.mongodb.client.model.geojson.Point;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findById(String id);
    Optional<User> findByName(String name);
    Optional<User> findByEmail(String email);
    Optional<User> findByPassword(String password);
    @Query("{ 'location': { $nearSphere: { $geometry: ?0, $maxDistance: ?1 } } }")
    List<User> findUsersNear(Point location, double maxDistance);
}
