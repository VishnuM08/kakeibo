package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findByUser(User user);

    List<Expense> findByUserAndExpenseDateTimeBetween(User user, LocalDateTime expenseDateTimeAfter, LocalDateTime expenseDateTimeBefore);

    List<Expense> user(User user);

    void deleteById(UUID id);


}

