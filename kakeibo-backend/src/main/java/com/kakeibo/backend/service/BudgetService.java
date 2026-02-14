package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.Budget;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.BudgetRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;

    // ===============================
    // SET / UPDATE MONTHLY BUDGET
    // ===============================
    @Transactional
    public Budget setMonthlyBudget(User user, double amount) {

        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        return budgetRepository
                .findByUserAndYearAndMonth(user, year, month)
                .map(budget -> {
                    budget.setMonthlyAmount(amount);
                    budget.setRemainingAmount(amount);
                    return budget;
                })
                .orElseGet(() -> {
                    Budget budget = new Budget();
                    budget.setUser(user);
                    budget.setYear(year);
                    budget.setMonth(month);
                    budget.setMonthlyAmount(amount);
                    budget.setRemainingAmount(amount);
                    return budgetRepository.save(budget);
                });
    }

    // ===============================
    // GET CURRENT MONTH BUDGET
    // ===============================
    public Budget getCurrentBudget(User user) {
        YearMonth now = YearMonth.now();

        return budgetRepository
                .findByUserAndYearAndMonth(
                        user,
                        now.getYear(),
                        now.getMonthValue()
                )
                .orElse(null);
    }

    // ===============================
    // REDUCE BUDGET (on expense add)
    // ===============================
    @Transactional
    public void reduceBudget(User user, double expenseAmount) {
        YearMonth now = YearMonth.now();

        budgetRepository
                .findByUserAndYearAndMonth(
                        user,
                        now.getYear(),
                        now.getMonthValue()
                )
                .ifPresent(budget ->
                        budget.setRemainingAmount(
                                budget.getRemainingAmount() - expenseAmount
                        )
                );
    }

    // ===============================
    // RESTORE BUDGET (on delete)
    // ===============================
    @Transactional
    public void restoreBudget(User user, double amount) {
        YearMonth now = YearMonth.now();

        budgetRepository
                .findByUserAndYearAndMonth(
                        user,
                        now.getYear(),
                        now.getMonthValue()
                )
                .ifPresent(budget ->
                        budget.setRemainingAmount(
                                budget.getRemainingAmount() + amount
                        )
                );
    }

    // ===============================
    // ADJUST BUDGET (on update)
    // delta can be + or -
    // ===============================
    @Transactional
    public void adjustBudget(User user, double delta) {
        YearMonth now = YearMonth.now();

        budgetRepository
                .findByUserAndYearAndMonth(
                        user,
                        now.getYear(),
                        now.getMonthValue()
                )
                .ifPresent(budget ->
                        budget.setRemainingAmount(
                                budget.getRemainingAmount() + delta
                        )
                );
    }
}
