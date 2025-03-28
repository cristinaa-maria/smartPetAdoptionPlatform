package com.example.animal_adoption_platform.service;

import com.example.animal_adoption_platform.dto.PostDTO;
import com.example.animal_adoption_platform.model.Post;
import com.example.animal_adoption_platform.repository.PostRepository;
import org.springframework.stereotype.Service;

@Service
public class PostService {
    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public void createPost(PostDTO postDTO) {
        Post post = new Post();
        post.setContent(postDTO.getContent());
        post.setCreatedAt(postDTO.getCreatedAt());
        post.setComments(postDTO.getComments());
        post.setLikes(postDTO.getLikes());
        post.setImageUrl(postDTO.getImageUrl());
        postRepository.save(post);
    }

    public void deletePost(String postId) {
        postRepository.deleteById(postId);
    }

    public void updatePost(String postId, String content) {
        Post post = postRepository.findById(postId).get();
        post.setContent(content);
        postRepository.save(post);

    }
}
