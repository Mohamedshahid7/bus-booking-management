package com.busbooking.backend.repository;

import com.busbooking.backend.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BusRepository extends JpaRepository<Bus, Long> {

    Optional<Bus> findByBusNumber(String busNumber);

    Optional<Bus> findByRegistrationNumber(String registrationNumber);

    List<Bus> findByOperatorId(Long operatorId);

    List<Bus> findByActiveTrue();

    boolean existsByBusNumber(String busNumber);

    boolean existsByRegistrationNumber(String registrationNumber);
}