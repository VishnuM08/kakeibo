package com.kakeibo.backend.service;

import com.kakeibo.backend.dto.BudgetResponse;
import com.kakeibo.backend.entity.Budget;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.BudgetRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
        public BudgetResponse setMonthlyBudget(User user, double amount) {

                LocalDate now = LocalDate.now();
                int year = now.getYear();
                int month = now.getMonthValue();
                BigDecimal budgetAmount = BigDecimal.valueOf(amount);

                Budget savedBudget = budgetRepository
                                .findByUserAndYearAndMonth(user, year, month)
                                .map(budget -> {
                                        budget.setMonthlyAmount(budgetAmount);
                                        budget.setRemainingAmount(budgetAmount);
                                        return budget;
                                })
                                .orElseGet(() -> {
                                        Budget budget = new Budget();
                                        budget.setUser(user);
                                        budget.setYear(year);
                                        budget.setMonth(month);
                                        budget.setMonthlyAmount(budgetAmount);
                                        budget.setRemainingAmount(budgetAmount);
                                        return budgetRepository.save(budget);
                                });

                return new BudgetResponse(
                                savedBudget.getMonthlyAmount().doubleValue(),
                                savedBudget.getRemainingAmount().doubleValue());
        }

        // ===============================
        // GET CURRENT MONTH BUDGET
        // ===============================
        public BudgetResponse getCurrentBudget(User user) {
                YearMonth now = YearMonth.now();

                return budgetRepository
                                .findByUserAndYearAndMonth(
                                                user,
                                                now.getYear(),
                                                now.getMonthValue())
                                .map(budget -> new BudgetResponse(
                                                budget.getMonthlyAmount().doubleValue(),
                                                budget.getRemainingAmount().doubleValue()))
                                .orElse(null);
        }

        // ===============================
        // REDUCE BUDGET (on expense add)
        // ===============================
        @Transactional
        public void reduceBudget(User user, double expenseAmount) {
                YearMonth now = YearMonth.now();
                BigDecimal expense = BigDecimal.valueOf(expenseAmount);

                budgetRepository
                                .findByUserAndYearAndMonth(
                                                user,
                                                now.getYear(),
                                                now.getMonthValue())
                                .ifPresent(budget -> budget.setRemainingAmount(
                                                budget.getRemainingAmount().subtract(expense)));
        }

        // ===============================
        // RESTORE BUDGET (on delete)
        // ===============================
        @Transactional
        public void restoreBudget(User user, double amount) {
                YearMonth now = YearMonth.now();
                BigDecimal restoreAmount = BigDecimal.valueOf(amount);

                budgetRepository
                                .findByUserAndYearAndMonth(
                                                user,
                                                now.getYear(),
                                                now.getMonthValue())
                                .ifPresent(budget -> budget.setRemainingAmount(
                                                budget.getRemainingAmount().add(restoreAmount)));
        }

        // ===============================
        // ADJUST BUDGET (on update)
        // delta can be + or -
        // ===============================
        @Transactional
        public void adjustBudget(User user, double delta) {
                YearMonth now = YearMonth.now();
                BigDecimal deltaAmount = BigDecimal.valueOf(delta);

                budgetRepository
                                .findByUserAndYearAndMonth(
                                                user,
                                                now.getYear(),
                                                now.getMonthValue())
                                .ifPresent(budget -> budget.setRemainingAmount(
                                                budget.getRemainingAmount().add(deltaAmount)));
        }
}
