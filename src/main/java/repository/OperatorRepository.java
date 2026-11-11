package com.busbooking.backend.repository;

import com.busbooking.backend.entity.Operator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OperatorRepository extends JpaRepository<Operator, Long> {

    Optional<Operator> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Operator> findByVerifiedTrue();

    List<Operator> findByVerifiedFalse();

    boolean existsById(Long id);
}