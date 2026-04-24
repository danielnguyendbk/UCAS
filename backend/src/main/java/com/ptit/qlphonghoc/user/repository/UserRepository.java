package com.ptit.qlphonghoc.user.repository;

import com.ptit.qlphonghoc.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsernameAndIsDeletedFalse(String username);

    Optional<User> findByIdAndIsDeletedFalse(Integer id);

    boolean existsByUsername(String username);
}
