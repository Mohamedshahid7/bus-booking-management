package com.busbooking.backend.repository;

import com.busbooking.backend.entity.Trip;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByBusId(Long busId);

    List<Trip> findByRouteId(Long routeId);

    List<Trip> findByStatus(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Trip t WHERE t.id = :tripId")
    Optional<Trip> findByIdWithLock(@Param("tripId") Long tripId);

    @Query("""
        SELECT t FROM Trip t, Route r
        WHERE r.id = t.routeId
        AND LOWER(TRIM(r.source)) = LOWER(TRIM(:source))
        AND LOWER(TRIM(r.destination)) = LOWER(TRIM(:destination))
        AND r.active = true
        AND t.departureTime >= :startTime
        AND t.departureTime < :endTime
        AND t.status = 'SCHEDULED'
        AND t.availableSeats > 0
        ORDER BY t.departureTime ASC
        """)
    List<Trip> searchTrips(
            @Param("source") String source,
            @Param("destination") String destination,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}