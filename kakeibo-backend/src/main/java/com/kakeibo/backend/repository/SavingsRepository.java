package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.Savings;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SavingsRepository extends JpaRepository<Savings, UUID> {

    List<Savings> findByUser(User user);
}
