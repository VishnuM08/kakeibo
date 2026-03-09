package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findByUser(User user);

    List<Expense> findByUserAndExpenseDateTimeBetween(User user, LocalDateTime expenseDateTimeAfter, LocalDateTime expenseDateTimeBefore);

    List<Expense> user(User user);

    void deleteById(UUID id);

    @Modifying
    @Transactional
    @Query("DELETE FROM Expense e WHERE e.user = :user")
    void deleteByUser(User user);

    boolean existsByReferenceId(String referenceId);

}

