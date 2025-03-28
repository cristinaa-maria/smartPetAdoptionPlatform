package com.example.animal_adoption_platform.dto;


import com.example.animal_adoption_platform.model.Comment;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
public class PostDTO {

    private String userId;
    private String content;
    private String imageUrl;
    private LocalDateTime createdAt;
    private List<Comment> comments;
    private int likes;

}
