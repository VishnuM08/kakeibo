package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Budget;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    Optional<Budget> findByUserAndYearAndMonth(
            User user,
            int year,
            int month
    );
}
