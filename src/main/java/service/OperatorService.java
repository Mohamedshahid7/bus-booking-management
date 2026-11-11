package com.busbooking.backend.service;

import com.busbooking.backend.entity.Operator;
import com.busbooking.backend.repository.OperatorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperatorService {

    private final OperatorRepository operatorRepository;

    public OperatorService(OperatorRepository operatorRepository) {
        this.operatorRepository = operatorRepository;
    }

    public Operator createOperator(Operator operator) {

        if (operatorRepository.existsByEmail(operator.getEmail())) {
            throw new RuntimeException("Operator email already exists");
        }

        operator.setVerified(false);

        return operatorRepository.save(operator);
    }

    public List<Operator> getAllOperators() {
        return operatorRepository.findAll();
    }

    public Operator getOperatorById(Long id) {

        return operatorRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Operator not found"));
    }

    public List<Operator> getVerifiedOperators() {
        return operatorRepository.findByVerifiedTrue();
    }

    public List<Operator> getPendingOperators() {
        return operatorRepository.findByVerifiedFalse();
    }

    public Operator verifyOperator(Long id) {

        Operator operator = getOperatorById(id);

        operator.setVerified(true);

        return operatorRepository.save(operator);
    }

    public void deleteOperator(Long id) {

        Operator operator = getOperatorById(id);

        operatorRepository.delete(operator);
    }
}
