package com.example.animal_adoption_platform.service;

import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.UserRepository;
import com.example.animal_adoption_platform.dto.UserDTO;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public String registerUser(UserDTO user) {
        User newUser = new User();
        newUser.setName(user.getName());
        newUser.setEmail(user.getEmail());
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));

        User savedUser = userRepository.save(newUser);
        return savedUser.getId();
    }


    public String loginUser(UserDTO user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent() && passwordEncoder.matches(user.getPassword(), existingUser.get().getPassword())) {
            User authenticatedUser = existingUser.get();
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    existingUser.get().getId(),
                    null,
                    null
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            return authenticatedUser.getId();
        }
        return null;
    }

}
