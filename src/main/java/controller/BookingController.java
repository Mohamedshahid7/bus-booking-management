package com.busbooking.backend.controller;

import com.busbooking.backend.entity.Booking;
import com.busbooking.backend.entity.User;
import com.busbooking.backend.repository.UserRepository;
import com.busbooking.backend.service.BookingService;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(
            BookingService bookingService,
            UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    // Create booking for logged-in customer
    @PostMapping
    public Booking createBooking(
            @RequestBody Booking booking,
            Authentication authentication) {

        requireRole(authentication, "ROLE_CUSTOMER");

        User user = getAuthenticatedUser(authentication);
        booking.setUserId(user.getId());

        return bookingService.createBooking(booking);
    }

    // ADMIN can view all bookings
    @GetMapping
    public List<Booking> getAllBookings(
            Authentication authentication) {

        requireRole(authentication, "ROLE_ADMIN");

        return bookingService.getAllBookings();
    }

    // Customer can view their own booking history
    @GetMapping("/my-bookings")
    public List<Booking> getMyBookings(
            Authentication authentication) {

        requireRole(authentication, "ROLE_CUSTOMER");

        User user = getAuthenticatedUser(authentication);

        return bookingService.getBookingsByUser(user.getId());
    }

    // View individual booking
    @GetMapping("/{id}")
    public Booking getBookingById(
            @PathVariable Long id,
            Authentication authentication) {

        Booking booking = bookingService.getBookingById(id);

        if (hasRole(authentication, "ROLE_ADMIN")) {
            return booking;
        }

        User user = getAuthenticatedUser(authentication);

        if (!booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "You cannot view another customer's booking");
        }

        return booking;
    }

    // View bookings by user ID
    @GetMapping("/user/{userId}")
    public List<Booking> getBookingsByUser(
            @PathVariable Long userId,
            Authentication authentication) {

        if (hasRole(authentication, "ROLE_ADMIN")) {
            return bookingService.getBookingsByUser(userId);
        }

        User user = getAuthenticatedUser(authentication);

        if (!user.getId().equals(userId)) {
            throw new AccessDeniedException(
                    "You cannot view another customer's bookings");
        }

        return bookingService.getBookingsByUser(userId);
    }

    // ADMIN can view bookings for a trip
    @GetMapping("/trip/{tripId}")
    public List<Booking> getBookingsByTrip(
            @PathVariable Long tripId,
            Authentication authentication) {

        requireRole(authentication, "ROLE_ADMIN");

        return bookingService.getBookingsByTrip(tripId);
    }

    // Customer can cancel their own booking
    @PatchMapping("/{id}/cancel")
    public Booking cancelBooking(
            @PathVariable Long id,
            Authentication authentication) {

        requireRole(authentication, "ROLE_CUSTOMER");

        return bookingService.cancelBooking(
                id,
                authentication.getName()
        );
    }

    private User getAuthenticatedUser(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new AccessDeniedException("User not found"));
    }

    private boolean hasRole(
            Authentication authentication,
            String role) {

        return authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getAuthorities().stream()
                        .anyMatch(authority ->
                                authority.getAuthority().equals(role));
    }

    private void requireRole(
            Authentication authentication,
            String role) {

        if (!hasRole(authentication, role)) {
            throw new AccessDeniedException(
                    "You do not have permission to perform this action");
        }
    }
}