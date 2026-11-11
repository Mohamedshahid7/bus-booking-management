package com.busbooking.backend.service;

import com.busbooking.backend.entity.Route;
import com.busbooking.backend.repository.RouteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RouteService {

    private final RouteRepository routeRepository;

    public RouteService(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Route getRouteById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found"));
    }

    public List<Route> searchRoutes(String source, String destination) {
        if (source != null && !source.isBlank()
                && destination != null && !destination.isBlank()) {
            return routeRepository.findBySourceIgnoreCaseAndDestinationIgnoreCase(
                    source.trim(), destination.trim());
        }

        if (source != null && !source.isBlank()) {
            return routeRepository.findBySourceIgnoreCase(source.trim());
        }

        if (destination != null && !destination.isBlank()) {
            return routeRepository.findByDestinationIgnoreCase(destination.trim());
        }

        return routeRepository.findAll();
    }

    @Transactional
    public Route createRoute(Route route) {
        route.setId(null);

        if (route.getSource() == null || route.getSource().isBlank()
                || route.getDestination() == null
                || route.getDestination().isBlank()) {
            throw new IllegalArgumentException("Source and destination are required.");
        }

        route.setSource(route.getSource().trim());
        route.setDestination(route.getDestination().trim());

        return routeRepository.save(route);
    }

    @Transactional
    public Route updateRoute(Long id, Route updatedRoute) {
        Route existingRoute = getRouteById(id);

        existingRoute.setSource(updatedRoute.getSource());
        existingRoute.setDestination(updatedRoute.getDestination());
        existingRoute.setDistanceKm(updatedRoute.getDistanceKm());
        existingRoute.setDurationMinutes(updatedRoute.getDurationMinutes());
        existingRoute.setActive(updatedRoute.isActive());

        return routeRepository.save(existingRoute);
    }

    @Transactional
    public void deleteRoute(Long id) {
        Route route = getRouteById(id);
        routeRepository.delete(route);
    }
}