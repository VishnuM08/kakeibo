package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.Savings;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.SavingsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavingsService {

    private final SavingsRepository savingsRepository;

    /**
     * CREATE savings
     */
    @Transactional
    public Savings setSavings(
            User user,
            String goal,
            Double amount,
            LocalDate date
    ) {
        Savings savings = new Savings();
        savings.setUser(user);
        savings.setGoalName(goal);
        savings.setAmount(amount);
        savings.setRemainingAmount(amount); // 🔥 KEY LINE
        savings.setDate(date);

        return savingsRepository.save(savings);
    }

    /**
     * GET all savings for user
     */
    public List<Savings> getAllSavings(User user) {
        return savingsRepository.findByUser(user);
    }

    /**
     * ADD to savings (reduce remaining)
     */
    @Transactional
    public Savings addToSavings(
            UUID savingsId,
            User user,
            Double addAmount
    ) {
        Savings savings = savingsRepository
                .findById(savingsId)
                .orElseThrow(() -> new RuntimeException("Savings not found"));

        // 🔐 ownership check
        if (!savings.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (addAmount > savings.getRemainingAmount()) {
            throw new RuntimeException("Add amount exceeds remaining savings");
        }

        savings.setRemainingAmount(
                savings.getRemainingAmount() - addAmount
        );

        return savings;
    }

    /**
     * DELETE savings
     */
    @Transactional
    public void deleteSavings(UUID savingsId, User user) {
        Savings savings = savingsRepository
                .findById(savingsId)
                .orElseThrow(() -> new RuntimeException("Savings not found"));

        if (!savings.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        savingsRepository.delete(savings);
    }
}
