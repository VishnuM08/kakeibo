package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.Budget;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.BudgetRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;

    @Transactional
    public Budget setMonthlyBudget(User user, double amount) {

        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        Optional<Budget> existing =
                budgetRepository.findByUserAndYearAndMonth(user, year, month);

        if (existing.isPresent()) {
            Budget budget = existing.get();
            budget.setMonthlyAmount(amount);
            budget.setRemainingAmount(amount);
            return budgetRepository.save(budget);
        }

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setYear(year);
        budget.setMonth(month);
        budget.setMonthlyAmount(amount);
        budget.setRemainingAmount(amount);

        return budgetRepository.save(budget);
    }

    public Budget getCurrentBudget(User user) {

        LocalDate now = LocalDate.now();

        return budgetRepository
                .findByUserAndYearAndMonth(
                        user,
                        now.getYear(),
                        now.getMonthValue()
                )
                .orElse(null);
    }

    @Transactional
    public void reduceBudget(User user, double expenseAmount) {

        LocalDate now = LocalDate.now();

        budgetRepository
                .findByUserAndYearAndMonth(
                        user,
                        now.getYear(),
                        now.getMonthValue()
                )
                .ifPresent(budget -> {
                    budget.setRemainingAmount(
                            budget.getRemainingAmount() - expenseAmount
                    );
                });
    }
}
