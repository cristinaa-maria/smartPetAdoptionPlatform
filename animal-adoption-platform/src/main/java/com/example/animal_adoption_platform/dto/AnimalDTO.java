package com.example.animal_adoption_platform.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AnimalDTO {
    private String name;
    private String species;
    private String description;
    private String userId;
    private List<String> images;
    private List<String> typesOfAdoption;
    private List<Float> embeddings;
}
