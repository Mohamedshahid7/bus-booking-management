package com.busbooking.backend.controller;

import com.busbooking.backend.entity.Operator;
import com.busbooking.backend.entity.Bus;
import com.busbooking.backend.entity.Trip;
import com.busbooking.backend.entity.Booking;

import com.busbooking.backend.repository.OperatorRepository;
import com.busbooking.backend.repository.BusRepository;
import com.busbooking.backend.repository.TripRepository;
import com.busbooking.backend.repository.BookingRepository;

import com.busbooking.backend.service.OperatorService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/operator")
public class OperatorController {

    private final OperatorService operatorService;
    private final OperatorRepository operatorRepository;
    private final BusRepository busRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;

    public OperatorController(
            OperatorService operatorService,
            OperatorRepository operatorRepository,
            BusRepository busRepository,
            TripRepository tripRepository,
            BookingRepository bookingRepository) {

        this.operatorService = operatorService;
        this.operatorRepository = operatorRepository;
        this.busRepository = busRepository;
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> operatorDashboard(
            Authentication authentication) {

        String email = authentication.getName();

        Operator operator = operatorRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Operator account not found"));

        List<Bus> buses = busRepository.findByOperatorId(operator.getId());

        List<Trip> trips = new ArrayList<>();

        for (Bus bus : buses) {
            trips.addAll(tripRepository.findByBusId(bus.getId()));
        }

        int totalBookings = 0;
        int confirmedBookings = 0;

        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Trip trip : trips) {

            List<Booking> bookings =
                    bookingRepository.findByTripId(trip.getId());

            totalBookings += bookings.size();

            for (Booking booking : bookings) {

                if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {

                    confirmedBookings++;

                    if (booking.getTotalFare() != null) {
                        totalRevenue = totalRevenue.add(
                                booking.getTotalFare()
                        );
                    }
                }
            }
        }

        long activeBuses = buses.stream()
                .filter(bus -> Boolean.TRUE.equals(bus.getActive()))
                .count();

        long scheduledTrips = trips.stream()
                .filter(trip ->
                        "SCHEDULED".equalsIgnoreCase(trip.getStatus()))
                .count();

        Map<String, Object> dashboard = new LinkedHashMap<>();

        dashboard.put("companyName", operator.getCompanyName());
        dashboard.put("totalBuses", buses.size());
        dashboard.put("activeBuses", activeBuses);
        dashboard.put("totalTrips", trips.size());
        dashboard.put("scheduledTrips", scheduledTrips);
        dashboard.put("totalBookings", totalBookings);
        dashboard.put("confirmedBookings", confirmedBookings);
        dashboard.put("totalRevenue", totalRevenue);

        return ResponseEntity.ok(dashboard);
    }

    @PostMapping
    public ResponseEntity<Operator> createOperator(
            @RequestBody Operator operator) {

        Operator createdOperator =
                operatorService.createOperator(operator);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdOperator);
    }

    @GetMapping
    public ResponseEntity<List<Operator>> getAllOperators() {
        return ResponseEntity.ok(
                operatorService.getAllOperators()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Operator> getOperatorById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                operatorService.getOperatorById(id)
        );
    }

    @GetMapping("/verified")
    public ResponseEntity<List<Operator>> getVerifiedOperators() {
        return ResponseEntity.ok(
                operatorService.getVerifiedOperators()
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Operator>> getPendingOperators() {
        return ResponseEntity.ok(
                operatorService.getPendingOperators()
        );
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<Operator> verifyOperator(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                operatorService.verifyOperator(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteOperator(
            @PathVariable Long id) {

        operatorService.deleteOperator(id);

        return ResponseEntity.ok(
                "Operator deleted successfully"
        );
    }
}