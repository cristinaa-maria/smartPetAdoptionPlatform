package com.example.animal_adoption_platform.service;

import com.example.animal_adoption_platform.dto.PostDTO;
import com.example.animal_adoption_platform.model.Post;
import com.example.animal_adoption_platform.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

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
        post.setTag(postDTO.getTag());
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

    public List<Post> getAllPosts(){
        return postRepository.findAll();
    }

    public List<Post> getLatestPosts(){
        LocalDateTime now = LocalDateTime.now();
        List<Post> posts = postRepository.findAll();
        List<Post> latestPosts = new ArrayList<>();
        for (Post post : posts) {
            if(post.getCreatedAt().until(now, ChronoUnit.MONTHS) <= 3) {
                latestPosts.add(post);
            }
        }
        return latestPosts;
    }


}
