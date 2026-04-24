package com.ptit.qlphonghoc.lecturer.repository;

import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LecturerRepository extends JpaRepository<Lecturer, Integer> {

    Optional<Lecturer> findByUserId(Integer userId);
}
