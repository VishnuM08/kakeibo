package com.kakeibo.backend.service;

import com.kakeibo.backend.dto.SavingResponse;
import com.kakeibo.backend.entity.Savings;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.SavingsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class SavingsService {

    private final SavingsRepository savingsRepository;

    /**
     * CREATE savings
     */
    @Transactional
    @CacheEvict(value = "savings", key = "#user.id")
    public SavingResponse setSavings(
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

        Savings saved = savingsRepository.save(savings);
        return new SavingResponse(saved.getId(), saved.getGoalName(), saved.getAmount(), saved.getRemainingAmount(), saved.getDate());
    }

    /**
     * GET all savings for user
     */
    @Cacheable(value = "savings", key = "#user.id")
    public List<SavingResponse> getAllSavings(User user) {
        return savingsRepository.findByUser(user)
                .stream()
                .map(s -> new SavingResponse(s.getId(), s.getGoalName(), s.getAmount(), s.getRemainingAmount(), s.getDate()))
                .toList();
    }

    /**
     * ADD to savings (reduce remaining)
     */
    @Transactional
    @CacheEvict(value = "savings", key = "#user.id")
    public SavingResponse addToSavings(
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

        Savings saved = savingsRepository.save(savings);
        return new SavingResponse(saved.getId(), saved.getGoalName(), saved.getAmount(), saved.getRemainingAmount(), saved.getDate());
    }

    /**
     * DELETE savings
     */
    @Transactional
    @CacheEvict(value = "savings", key = "#user.id")
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
