package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Budget;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    Optional<Budget> findByUserAndYearAndMonth(
            User user,
            int year,
            int month
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM Budget b WHERE b.user = :user")
    void deleteByUser(User user);
}

