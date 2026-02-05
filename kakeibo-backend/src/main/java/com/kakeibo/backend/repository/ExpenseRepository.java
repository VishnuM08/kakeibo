package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findByUser(User user);

    List<Expense> findByUserAndExpenseDateBetween(
            User user,
            LocalDate start,
            LocalDate end
    );
}
