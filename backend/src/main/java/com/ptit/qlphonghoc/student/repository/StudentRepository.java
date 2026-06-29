package com.ptit.qlphonghoc.student.repository;

import com.ptit.qlphonghoc.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Integer> {

    Optional<Student> findByUserId(Integer userId);
}
