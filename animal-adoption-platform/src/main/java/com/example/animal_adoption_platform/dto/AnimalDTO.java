package com.example.animal_adoption_platform.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnimalDTO {
    private String name;
    private String species;
    private String description;
    private String userId;
    private byte[] image;
}
