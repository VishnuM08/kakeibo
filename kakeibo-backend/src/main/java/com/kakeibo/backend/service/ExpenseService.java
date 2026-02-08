package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.ExpenseRepository;
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

    public Expense createExpense(
            User user,
            Double amount,
            String description,
            String category,
            Instant expenseDateTime
    ) {
        Expense expense = new Expense();
        expense.setUser(user);
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setCategory(category);
        expense.setExpenseDateTime(expenseDateTime !=null ? expenseDateTime : Instant.now());

        return expenseRepository.save(expense);
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUser(user);
    }

    public void deleteExpense(UUID expenseId, User user) {
        Expense expense = expenseRepository
                .findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not allowed to delete this expense");
        }

        expenseRepository.delete(expense);
    }

    public Expense updateExpense(UUID expenseId, User user , Double amount,
                                 String description,
                                 String category) {
        Expense expense = expenseRepository
                .findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not allowed to delete this expense");

        }
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setCategory(category);

        return expenseRepository.save(expense);
    }
}