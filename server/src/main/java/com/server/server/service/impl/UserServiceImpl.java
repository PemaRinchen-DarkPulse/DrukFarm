package com.server.server.service.impl;

import com.server.server.dto.UserRegistrationDto;
import com.server.server.dto.UserResponseDto;
import com.server.server.entity.Role;
import com.server.server.entity.User;
import com.server.server.exception.DuplicateUserException;
import com.server.server.repository.UserRepository;
import com.server.server.service.UserService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserResponseDto register(UserRegistrationDto dto) {
        if (userRepository.existsByCid(dto.getCid())) {
            throw new DuplicateUserException("CID already exists: " + dto.getCid());
        }
        if (userRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new DuplicateUserException("Phone number already exists: " + dto.getPhoneNumber());
        }

        User user = new User();
        user.setCid(dto.getCid());
        user.setName(dto.getName());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        // Map role string to enum; accept case-insensitive
    user.setRole(Role.fromString(dto.getRole()));
        user.setLocation(dto.getLocation());
        user.setPhoneNumber(dto.getPhoneNumber());

        User saved = userRepository.save(user);
        return toResponseDto(saved);
    }

    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @Override
    public UserResponseDto login(String cid, String password) {
        return userRepository.findByCid(cid)
                .map(user -> {
                    if (passwordEncoder.matches(password, user.getPassword())) {
                        return toResponseDto(user);
                    } else {
                        throw new IllegalArgumentException("Invalid credentials");
                    }
                })
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserResponseDto toResponseDto(User user) {
        UserResponseDto r = new UserResponseDto();
        r.setCid(user.getCid());
        r.setName(user.getName());
        r.setRole(user.getRole() != null ? user.getRole().name().toLowerCase() : null);
        r.setLocation(user.getLocation());
        r.setPhoneNumber(user.getPhoneNumber());
        return r;
    }
}
