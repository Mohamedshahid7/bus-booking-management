package com.busbooking.backend.controller;

import com.busbooking.backend.entity.User;
import com.busbooking.backend.entity.Operator;
import com.busbooking.backend.entity.Bus;
import com.busbooking.backend.entity.Trip;
import com.busbooking.backend.entity.Booking;

import com.busbooking.backend.repository.UserRepository;
import com.busbooking.backend.repository.OperatorRepository;
import com.busbooking.backend.repository.BusRepository;
import com.busbooking.backend.repository.TripRepository;
import com.busbooking.backend.repository.BookingRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final OperatorRepository operatorRepository;
    private final BusRepository busRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;

    public AdminController(
            UserRepository userRepository,
            OperatorRepository operatorRepository,
            BusRepository busRepository,
            TripRepository tripRepository,
            BookingRepository bookingRepository) {

        this.userRepository = userRepository;
        this.operatorRepository = operatorRepository;
        this.busRepository = busRepository;
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> adminDashboard() {

        List<User> users = userRepository.findAll();
        List<Operator> operators = operatorRepository.findAll();
        List<Bus> buses = busRepository.findAll();
        List<Trip> trips = tripRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();

        long totalCustomers = users.stream()
                .filter(user -> "CUSTOMER".equalsIgnoreCase(user.getRole()))
                .count();

        long totalOperatorAccounts = users.stream()
                .filter(user -> "OPERATOR".equalsIgnoreCase(user.getRole()))
                .count();

        long activeBuses = buses.stream()
                .filter(bus -> Boolean.TRUE.equals(bus.getActive()))
                .count();

        long scheduledTrips = trips.stream()
                .filter(trip -> "SCHEDULED".equalsIgnoreCase(trip.getStatus()))
                .count();

        long confirmedBookings = bookings.stream()
                .filter(booking ->
                        "CONFIRMED".equalsIgnoreCase(booking.getStatus()))
                .count();

        BigDecimal totalRevenue = bookings.stream()
                .filter(booking ->
                        "CONFIRMED".equalsIgnoreCase(booking.getStatus()))
                .map(Booking::getTotalFare)
                .filter(fare -> fare != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> dashboard = new LinkedHashMap<>();

        dashboard.put("totalUsers", users.size());
        dashboard.put("totalCustomers", totalCustomers);
        dashboard.put("totalOperatorAccounts", totalOperatorAccounts);
        dashboard.put("totalOperators", operators.size());
        dashboard.put("totalBuses", buses.size());
        dashboard.put("activeBuses", activeBuses);
        dashboard.put("totalTrips", trips.size());
        dashboard.put("scheduledTrips", scheduledTrips);
        dashboard.put("totalBookings", bookings.size());
        dashboard.put("confirmedBookings", confirmedBookings);
        dashboard.put("totalRevenue", totalRevenue);

        return ResponseEntity.ok(dashboard);
    }
}