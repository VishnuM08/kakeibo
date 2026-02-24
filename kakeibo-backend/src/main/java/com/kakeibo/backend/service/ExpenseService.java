package com.kakeibo.backend.service;

import com.kakeibo.backend.dto.CreateExpenseRequest;
import com.kakeibo.backend.dto.ExpenseResponse;
import com.kakeibo.backend.dto.UpdateExpenseRequest;
import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.ExpenseRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BudgetService budgetService;

    // ===============================
    // CREATE
    // ===============================
    @Transactional
    public ExpenseResponse createExpense(
            CreateExpenseRequest req,
            CustomUserDetails userDetails
    ) {
        User user = userDetails.getUser();

        Expense expense = new Expense();
        expense.setUser(user);
        expense.setAmount(req.getAmount());
        expense.setDescription(req.getDescription());
        expense.setCategory(req.getCategory());
        expense.setExpenseDateTime(
                req.getExpenseDateTime() != null
                        ? req.getExpenseDateTime()
                        : Instant.now()
        );

        Expense saved = expenseRepository.save(expense);

        // 🔥 Reduce budget
        budgetService.reduceBudget(user, req.getAmount());

        return toResponse(saved);
    }


    // ===============================
    // READ
    // ===============================
    public List<ExpenseResponse> getUserExpenses(CustomUserDetails userDetails) {
        return expenseRepository.findByUser(userDetails.getUser())
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // ===============================
    // UPDATE
    // ===============================
    @Transactional
    public ExpenseResponse updateExpense(
            UUID expenseId,
            UpdateExpenseRequest req,
            CustomUserDetails userDetails
    ) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        User user = userDetails.getUser();

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        double oldAmount = expense.getAmount();
        double newAmount = req.getAmount();

        expense.setAmount(newAmount);
        expense.setCategory(req.getCategory());
        expense.setDescription(req.getDescription());
        expense.setExpenseDateTime(req.getExpenseDateTime());

        Expense saved = expenseRepository.save(expense);

        // 🔥 Adjust budget delta
        budgetService.adjustBudget(user, oldAmount - newAmount);

        return toResponse(saved);
    }

    // ===============================
    // DELETE
    // ===============================
    @Transactional
    public void deleteExpense(
            UUID expenseId,
            CustomUserDetails userDetails
    ) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        User user = userDetails.getUser();

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        expenseRepository.delete(expense);

        // 🔥 Restore budget
        budgetService.restoreBudget(user, expense.getAmount());
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getDescription(),
                expense.getCategory(),
                expense.getExpenseDateTime()
        );
    }


}
