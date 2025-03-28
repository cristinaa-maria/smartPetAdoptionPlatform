package com.example.animal_adoption_platform.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {
    private String name;
    private String email;
    private String password;
    private String location;
    private String phone;

}
