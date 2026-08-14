package com.hallbooking.service;

import com.hallbooking.dto.CreateAdminRequest;
import com.hallbooking.dto.UserDto;
import com.hallbooking.entity.User;
import com.hallbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDto createAdmin(CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.ADMIN)
                .build();

        return AuthService.toDto(userRepository.save(user));
    }

    public List<UserDto> getAllAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .map(AuthService::toDto)
                .toList();
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(AuthService::toDto)
                .toList();
    }
}
