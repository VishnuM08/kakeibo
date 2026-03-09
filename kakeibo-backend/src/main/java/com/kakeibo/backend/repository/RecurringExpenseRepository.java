package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.RecurringExpense;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, UUID> {
    List<RecurringExpense> findByUser(User user);
    List<RecurringExpense> findByActiveTrue();
}
