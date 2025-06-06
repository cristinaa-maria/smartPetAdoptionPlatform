package com.example.animal_adoption_platform.controller;


import com.example.animal_adoption_platform.dto.PostDTO;
import com.example.animal_adoption_platform.model.Post;
import com.example.animal_adoption_platform.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping("/createPost")
    public ResponseEntity<String> createPost(@RequestBody PostDTO postDTO) {
        postService.createPost(postDTO);
        return ResponseEntity.ok("Post created successfully");
    }

    @PatchMapping("/updatePost/{id}")
    public ResponseEntity<String> updatePost(@PathVariable String id, @RequestBody String content) {
        postService.updatePost(id, content);
        return ResponseEntity.ok("Post updated successfully");
    }

    @DeleteMapping("/deletePost/{id}")
    public ResponseEntity<String> deletePost(@PathVariable String id) {
        postService.deletePost(id);
        return ResponseEntity.ok("Post deleted successfully");
    }

    @GetMapping("/getPosts")
    public ResponseEntity<List<Post>> getAllPosts(){
        List<Post> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);

    }



}
