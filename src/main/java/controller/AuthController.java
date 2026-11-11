package com.busbooking.backend.controller;

import com.busbooking.backend.dto.AuthResponse;
import com.busbooking.backend.dto.LoginRequest;
import com.busbooking.backend.dto.LoginResponse;
import com.busbooking.backend.dto.RegisterRequest;
import com.busbooking.backend.entity.User;
import com.busbooking.backend.security.JwtService;
import com.busbooking.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService,
                          JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        User createdUser = userService.createUser(request);

        AuthResponse response = new AuthResponse(
                createdUser.getId(),
                createdUser.getFullName(),
                createdUser.getEmail(),
                createdUser.getPhone(),
                createdUser.getRole()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        User user = userService.authenticate(
                request.getEmail(),
                request.getPassword()
        );

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        LoginResponse response = new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}