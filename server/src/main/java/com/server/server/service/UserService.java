package com.server.server.service;

import com.server.server.dto.UserRegistrationDto;
import com.server.server.dto.UserResponseDto;
import java.util.List;

public interface UserService {
    UserResponseDto register(UserRegistrationDto dto);
    UserResponseDto login(String cid, String password);
    List<UserResponseDto> getAllUsers();
}
