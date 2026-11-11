package com.busbooking.backend.service;

import com.busbooking.backend.entity.Bus;
import com.busbooking.backend.repository.BusRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BusService {

    private final BusRepository busRepository;

    public BusService(BusRepository busRepository) {
        this.busRepository = busRepository;
    }

    public Bus createBus(Bus bus) {

        if (busRepository.existsByBusNumber(bus.getBusNumber())) {
            throw new RuntimeException("Bus number already exists");
        }

        if (busRepository.existsByRegistrationNumber(bus.getRegistrationNumber())) {
            throw new RuntimeException("Registration number already exists");
        }

        bus.setId(null);
        bus.setActive(true);

        return busRepository.save(bus);
    }

    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public Bus getBusById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found with ID: " + id));
    }
}
