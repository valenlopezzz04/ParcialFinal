package com.chat.controller;

import com.chat.domain.model.User;
import com.chat.domain.repository.UserRepository;
import com.chat.security.JwtUtil;
import com.chat.infrastructure.rest.dto.LoginRequestDto;
import com.chat.infrastructure.rest.dto.RegisterRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequestDto request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent() ||
            userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Username or email already exists";
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt()));
        userRepository.save(user);
        return "User registered";
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequestDto request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isPresent() && BCrypt.checkpw(request.getPassword(), userOpt.get().getPasswordHash())) {
            String jwt = jwtUtil.generateToken(userOpt.get().getUsername());
            return jwt;
        }
        return "Invalid credentials";
    }
}
