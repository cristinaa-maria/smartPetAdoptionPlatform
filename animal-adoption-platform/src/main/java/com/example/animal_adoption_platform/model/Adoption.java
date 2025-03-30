package com.example.animal_adoption_platform.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "adoptions")
public class Adoption {

    @Id
    private String id;

    private String adopterId;
    private String userId;
    private String animalId;
    private String status;
    private String type;
    private LocalDateTime adoptionDate;
    private int period;
}
