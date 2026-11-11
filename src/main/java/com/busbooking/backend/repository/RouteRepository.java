package com.busbooking.backend.repository;

import com.busbooking.backend.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {

    List<Route> findBySourceIgnoreCaseAndDestinationIgnoreCase(
            String source,
            String destination
    );

    List<Route> findBySourceIgnoreCase(String source);

    List<Route> findByDestinationIgnoreCase(String destination);

}

