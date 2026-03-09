package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.RecurringExpense;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, UUID> {
    List<RecurringExpense> findByUser(User user);
    List<RecurringExpense> findByActiveTrue();

    @Modifying
    @Transactional
    @Query("DELETE FROM RecurringExpense r WHERE r.user = :user")
    void deleteByUser(User user);
}
