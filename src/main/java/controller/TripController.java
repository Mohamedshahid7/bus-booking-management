package com.busbooking.backend.controller;

import com.busbooking.backend.entity.Trip;
import com.busbooking.backend.service.TripService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    // OPERATOR: CREATE TRIP
    @PostMapping
    public Trip createTrip(
            @RequestBody Trip trip,
            Authentication authentication) {

        return tripService.createTripForOperator(
                trip,
                authentication.getName()
        );
    }

    // OPERATOR: UPDATE OWN TRIP
    @PutMapping("/{id:[0-9]+}")
    public Trip updateTrip(
            @PathVariable Long id,
            @RequestBody Trip trip,
            Authentication authentication) {

        return tripService.updateTrip(
                id,
                trip,
                authentication.getName()
        );
    }

    // OPERATOR: CANCEL OWN TRIP
    @PatchMapping("/{id:[0-9]+}/cancel")
    public Trip cancelTrip(
            @PathVariable Long id,
            Authentication authentication) {

        return tripService.cancelTrip(
                id,
                authentication.getName()
        );
    }

    // PUBLIC: GET ALL TRIPS
    @GetMapping
    public List<Trip> getAllTrips() {
        return tripService.getAllTrips();
    }

    // PUBLIC: SEARCH TRIPS
    @GetMapping("/search")
    public List<Trip> searchTrips(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return tripService.searchTrips(source, destination, date);
    }

    // PUBLIC: GET TRIP BY ID
    @GetMapping("/{id:[0-9]+}")
    public Trip getTripById(@PathVariable Long id) {
        return tripService.getTripById(id);
    }

    // PUBLIC: SEAT AVAILABILITY
    @GetMapping("/{id}/availability")
    public Map<String, Object> getSeatAvailability(
            @PathVariable Long id) {

        Trip trip = tripService.getTripById(id);

        return Map.of(
                "tripId", trip.getId(),
                "availableSeats", trip.getAvailableSeats(),
                "status", trip.getStatus()
        );
    }

    @GetMapping("/bus/{busId}")
    public List<Trip> getTripsByBus(@PathVariable Long busId) {
        return tripService.getTripsByBus(busId);
    }

    @GetMapping("/route/{routeId}")
    public List<Trip> getTripsByRoute(@PathVariable Long routeId) {
        return tripService.getTripsByRoute(routeId);
    }

    @GetMapping("/status/{status}")
    public List<Trip> getTripsByStatus(@PathVariable String status) {
        return tripService.getTripsByStatus(status);
    }
}