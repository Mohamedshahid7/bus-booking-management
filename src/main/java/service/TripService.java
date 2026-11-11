package com.busbooking.backend.service;

import com.busbooking.backend.entity.Bus;
import com.busbooking.backend.entity.Booking;
import com.busbooking.backend.entity.Operator;
import com.busbooking.backend.entity.Trip;
import com.busbooking.backend.repository.BookingRepository;
import com.busbooking.backend.repository.BusRepository;
import com.busbooking.backend.repository.OperatorRepository;
import com.busbooking.backend.repository.TripRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final BusRepository busRepository;
    private final OperatorRepository operatorRepository;
    private final BookingRepository bookingRepository;

    public TripService(
            TripRepository tripRepository,
            BusRepository busRepository,
            OperatorRepository operatorRepository,
            BookingRepository bookingRepository) {

        this.tripRepository = tripRepository;
        this.busRepository = busRepository;
        this.operatorRepository = operatorRepository;
        this.bookingRepository = bookingRepository;
    }

    // CREATE TRIP
    @Transactional
    public Trip createTripForOperator(Trip trip, String email) {

        Operator operator = getOperator(email);

        if (trip.getBusId() == null || trip.getRouteId() == null) {
            throw new RuntimeException("Bus ID and Route ID are required");
        }

        Bus bus = getOwnedBus(trip.getBusId(), operator);

        if (!Boolean.TRUE.equals(bus.getActive())) {
            throw new RuntimeException("This bus is inactive");
        }

        validateTripDetails(trip);

        trip.setId(null);
        trip.setAvailableSeats(bus.getTotalSeats());
        trip.setStatus("SCHEDULED");

        return tripRepository.save(trip);
    }

    // UPDATE TRIP
    @Transactional
    public Trip updateTrip(Long tripId, Trip updates, String email) {

        Operator operator = getOperator(email);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        verifyOwnership(trip, operator);
        ensureTripCanBeModified(trip);
        ensureNoConfirmedBookings(tripId);

        if (updates.getDepartureTime() == null ||
                updates.getArrivalTime() == null ||
                updates.getFare() == null) {
            throw new RuntimeException(
                    "Departure time, arrival time and fare are required"
            );
        }

        trip.setDepartureTime(updates.getDepartureTime());
        trip.setArrivalTime(updates.getArrivalTime());
        trip.setFare(updates.getFare());

        validateTripDetails(trip);

        return tripRepository.save(trip);
    }

    // CANCEL TRIP
    @Transactional
    public Trip cancelTrip(Long tripId, String email) {

        Operator operator = getOperator(email);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        verifyOwnership(trip, operator);
        ensureTripCanBeModified(trip);
        ensureNoConfirmedBookings(tripId);

        trip.setStatus("CANCELLED");

        return tripRepository.save(trip);
    }

    // CHECK OPERATOR
    private Operator getOperator(String email) {

        return operatorRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Operator account not found for this login email"
                        )
                );
    }

    // CHECK BUS OWNERSHIP
    private Bus getOwnedBus(Long busId, Operator operator) {

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found"));

        if (!bus.getOperatorId().equals(operator.getId())) {
            throw new RuntimeException(
                    "You are not authorized to use this bus"
            );
        }

        return bus;
    }

    private void verifyOwnership(Trip trip, Operator operator) {

        getOwnedBus(trip.getBusId(), operator);
    }

    // CHECK TRIP STATUS AND DEPARTURE
    private void ensureTripCanBeModified(Trip trip) {

        if (!"SCHEDULED".equalsIgnoreCase(trip.getStatus())) {
            throw new RuntimeException(
                    "Only scheduled trips can be modified"
            );
        }

        if (trip.getDepartureTime() == null ||
                !trip.getDepartureTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Trip has already departed or departure time has passed"
            );
        }
    }

    // PROTECT EXISTING BOOKINGS
    private void ensureNoConfirmedBookings(Long tripId) {

        List<Booking> bookings =
                bookingRepository.findByTripId(tripId);

        boolean hasConfirmedBookings = bookings.stream()
                .anyMatch(booking ->
                        "CONFIRMED".equalsIgnoreCase(booking.getStatus())
                );

        if (hasConfirmedBookings) {
            throw new RuntimeException(
                    "This trip has confirmed bookings. " +
                            "Modification or cancellation is not allowed."
            );
        }
    }

    // VALIDATE TRIP
    private void validateTripDetails(Trip trip) {

        if (trip.getDepartureTime() == null ||
                trip.getArrivalTime() == null ||
                !trip.getArrivalTime().isAfter(trip.getDepartureTime())) {

            throw new RuntimeException(
                    "Invalid departure or arrival time"
            );
        }

        if (!trip.getDepartureTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Departure time must be in the future"
            );
        }

        if (trip.getFare() == null ||
                trip.getFare().signum() <= 0) {

            throw new RuntimeException(
                    "Fare must be greater than zero"
            );
        }
    }

    // EXISTING FEATURES

    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    public Trip getTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
    }

    public List<Trip> getTripsByBus(Long busId) {
        return tripRepository.findByBusId(busId);
    }

    public List<Trip> getTripsByRoute(Long routeId) {
        return tripRepository.findByRouteId(routeId);
    }

    public List<Trip> getTripsByStatus(String status) {
        return tripRepository.findByStatus(status);
    }

    public List<Trip> searchTrips(
            String source,
            String destination,
            LocalDate date) {

        if (source == null || source.isBlank()) {
            throw new RuntimeException("Source is required");
        }

        if (destination == null || destination.isBlank()) {
            throw new RuntimeException("Destination is required");
        }

        if (date == null) {
            throw new RuntimeException("Travel date is required");
        }

        if (source.trim().equalsIgnoreCase(destination.trim())) {
            throw new RuntimeException(
                    "Source and destination cannot be the same"
            );
        }

        return tripRepository.searchTrips(
                source,
                destination,
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
        );
    }
}