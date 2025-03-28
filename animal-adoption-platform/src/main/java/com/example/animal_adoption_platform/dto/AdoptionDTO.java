package com.example.animal_adoption_platform.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Date;
@Getter
@Setter
public class AdoptionDTO {

    private String ownerId;
    private String animalId;
    private String adopterId;
    private String status;
    private LocalDateTime scheduledDate;
    private String type;
    private int period;

}
