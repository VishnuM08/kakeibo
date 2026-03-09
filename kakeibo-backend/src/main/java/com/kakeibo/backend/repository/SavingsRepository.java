package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Savings;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface SavingsRepository extends JpaRepository<Savings, UUID> {

    List<Savings> findByUser(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM Savings s WHERE s.user = :user")
    void deleteByUser(User user);
}
