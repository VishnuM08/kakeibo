package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public Expense createExpense(
            User user,
            Double amount,
            String description,
            String category,
            LocalDate expenseDate
    ) {
        Expense expense = new Expense();
        expense.setUser(user);
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setCategory(category);
        expense.setExpenseDate(expenseDate);

        return expenseRepository.save(expense);
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUser(user);
    }
}
