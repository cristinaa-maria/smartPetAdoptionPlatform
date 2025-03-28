package com.example.animal_adoption_platform.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.geo.Point;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "animals")
public class Animal {
    @Id
    private String id;

    private String ownerId;
    private String name;
    private String species;
    private String description;
    private Point location;
    @LastModifiedDate
    private Instant updatedAt;

}
