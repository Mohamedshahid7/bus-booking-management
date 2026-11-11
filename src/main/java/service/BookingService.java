package com.busbooking.backend.service;

import com.busbooking.backend.entity.Booking;
import com.busbooking.backend.entity.Trip;
import com.busbooking.backend.entity.User;
import com.busbooking.backend.repository.BookingRepository;
import com.busbooking.backend.repository.TripRepository;
import com.busbooking.backend.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public BookingService(
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            UserRepository userRepository) {

        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Booking createBooking(Booking booking) {

        booking.setId(null);

        if (booking.getUserId() == null || booking.getTripId() == null) {
            throw new RuntimeException("User ID and Trip ID are required");
        }

        if (booking.getSeatsBooked() == null || booking.getSeatsBooked() <= 0) {
            throw new RuntimeException("Number of seats must be greater than zero");
        }

        // Lock trip while checking and updating available seats
        Trip trip = tripRepository.findByIdWithLock(booking.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!"SCHEDULED".equalsIgnoreCase(trip.getStatus())) {
            throw new RuntimeException("Trip is not available for booking");
        }

        if (trip.getDepartureTime() == null ||
                !trip.getDepartureTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Booking is closed. Trip has already departed."
            );
        }

        if (trip.getAvailableSeats() < booking.getSeatsBooked()) {
            throw new RuntimeException("Not enough seats available");
        }

        BigDecimal totalFare = trip.getFare()
                .multiply(BigDecimal.valueOf(booking.getSeatsBooked()));

        booking.setTotalFare(totalFare);
        booking.setStatus("CONFIRMED");

        trip.setAvailableSeats(
                trip.getAvailableSeats() - booking.getSeatsBooked()
        );

        tripRepository.save(trip);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUserId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to cancel this booking"
            );
        }

        if (!"CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException(
                    "Only confirmed bookings can be cancelled"
            );
        }

        // Lock trip before checking departure and restoring seats
        Trip trip = tripRepository.findByIdWithLock(booking.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        // Prevent cancellation after departure
        if (trip.getDepartureTime() == null ||
                !trip.getDepartureTime().isAfter(LocalDateTime.now())) {

            throw new RuntimeException(
                    "Cancellation is closed. Trip has already departed."
            );
        }

        // Restore available seats
        trip.setAvailableSeats(
                trip.getAvailableSeats() + booking.getSeatsBooked()
        );

        tripRepository.save(trip);

        booking.setStatus("CANCELLED");

        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByTrip(Long tripId) {
        return bookingRepository.findByTripId(tripId);
    }
}