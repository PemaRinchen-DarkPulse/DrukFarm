package com.server.server.repository;

import com.server.server.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByCid(String cid);
    boolean existsByPhoneNumber(String phoneNumber);
    Optional<User> findByCid(String cid);
}
