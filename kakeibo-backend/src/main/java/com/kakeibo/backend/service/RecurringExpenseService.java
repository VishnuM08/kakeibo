package com.kakeibo.backend.service;

import com.kakeibo.backend.dto.CreateRecurringExpenseRequest;
import com.kakeibo.backend.dto.RecurringExpenseResponse;
import com.kakeibo.backend.dto.UpdateRecurringExpenseRequest;
import com.kakeibo.backend.entity.Expense;
import com.kakeibo.backend.entity.RecurringExpense;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.ExpenseRepository;
import com.kakeibo.backend.repository.RecurringExpenseRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetService budgetService;


    @Transactional
    @CacheEvict(value = "recurringExpenses", key = "#userDetails.user.id")
    public RecurringExpenseResponse createRecurringExpense(CreateRecurringExpenseRequest request, CustomUserDetails userDetails) {
        validateAmount(request.getAmount());
        validateDateRange(request.getStartDate(), request.getEndDate());

        User user = userDetails.getUser();

        RecurringExpense recurringExpense = new RecurringExpense();
        recurringExpense.setUser(user);
        recurringExpense.setAmount(BigDecimal.valueOf(request.getAmount()));
        recurringExpense.setCategory(request.getCategory());
        recurringExpense.setDescription(request.getDescription());
        recurringExpense.setFrequency(request.getFrequency());
        recurringExpense.setStartDate(request.getStartDate());
        recurringExpense.setEndDate(request.getEndDate());
        recurringExpense.setActive(request.getIsActive() == null || request.getIsActive());

        RecurringExpense savedRecurringExpense = recurringExpenseRepository.save(recurringExpense);
        return toResponse(savedRecurringExpense);
    }

    @Cacheable(value = "recurringExpenses", key = "#userDetails.user.id")
    public List<RecurringExpenseResponse> getRecurringExpenses(CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        return recurringExpenseRepository.findByUser(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @CacheEvict(value = "recurringExpenses", key = "#userDetails.user.id")
    public RecurringExpenseResponse updateRecurringExpense(UUID recurringExpenseId, UpdateRecurringExpenseRequest request, CustomUserDetails userDetails) {
        User user = userDetails.getUser();

        RecurringExpense recurringExpense = recurringExpenseRepository.findById(recurringExpenseId)
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));

        if (!recurringExpense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (request.getAmount() != null) {
            validateAmount(request.getAmount());
            recurringExpense.setAmount(BigDecimal.valueOf(request.getAmount()));
        }
        if (request.getCategory() != null) {
            if (request.getCategory().isBlank()) {
                throw new IllegalArgumentException("Category cannot be blank");
            }
            recurringExpense.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            if (request.getDescription().isBlank()) {
                throw new IllegalArgumentException("Description cannot be blank");
            }
            recurringExpense.setDescription(request.getDescription());
        }
        if (request.getFrequency() != null) {
            recurringExpense.setFrequency(request.getFrequency());
        }
        if (request.getStartDate() != null) {
            recurringExpense.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            recurringExpense.setEndDate(request.getEndDate());
        }
        if (request.getIsActive() != null) {
            recurringExpense.setActive(request.getIsActive());
        }

        validateDateRange(recurringExpense.getStartDate(), recurringExpense.getEndDate());

        RecurringExpense updatedRecurringExpense = recurringExpenseRepository.save(recurringExpense);
        return toResponse(updatedRecurringExpense);
    }

    @Transactional
    @CacheEvict(value = "recurringExpenses", key = "#userDetails.user.id")
    public void deleteRecurringExpense(UUID recurringExpenseId, CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        RecurringExpense recurringExpense = recurringExpenseRepository.findById(recurringExpenseId)
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));
        if (!recurringExpense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        recurringExpenseRepository.delete(recurringExpense);
    }

    @Transactional
    public int generateDueExpenses(LocalDate runDate) {
        int createdCount = 0;
        List<RecurringExpense> recurringExpenses = recurringExpenseRepository.findByActiveTrue();

        for (RecurringExpense recurringExpense : recurringExpenses) {
            createdCount += generateExpensesForRecurring(recurringExpense, runDate);
        }

        return createdCount;
    }

    private int generateExpensesForRecurring(RecurringExpense recurringExpense, LocalDate runDate) {
        LocalDate nextDueDate = resolveNextDueDate(recurringExpense);

        if (nextDueDate == null || nextDueDate.isAfter(runDate)) {
            return 0;
        }

        int createdCount = 0;

        while (!nextDueDate.isAfter(runDate) && isWithinEndDate(recurringExpense, nextDueDate)) {
            String referenceId = recurringExpense.getId() + ":" + nextDueDate;

            if (!expenseRepository.existsByReferenceId(referenceId)) {
                Expense expense = new Expense();
                expense.setUser(recurringExpense.getUser());
                expense.setAmount(recurringExpense.getAmount().doubleValue());
                expense.setCategory(recurringExpense.getCategory());
                expense.setDescription(recurringExpense.getDescription());
                expense.setSource("RECURRING");
                expense.setReferenceId(referenceId);
                expense.setExpenseDateTime(nextDueDate.atStartOfDay(ZoneOffset.UTC).toInstant());

                expenseRepository.save(expense);
                budgetService.reduceBudget(recurringExpense.getUser(), recurringExpense.getAmount().doubleValue());
                createdCount++;
            }

            recurringExpense.setLastGenerated(nextDueDate);
            nextDueDate = nextOccurrence(nextDueDate, recurringExpense.getFrequency());
        }

        if (shouldDeactivate(recurringExpense, runDate, nextDueDate)) {
            recurringExpense.setActive(false);
        }

        recurringExpenseRepository.save(recurringExpense);
        return createdCount;
    }

    private boolean shouldDeactivate(RecurringExpense recurringExpense, LocalDate runDate, LocalDate nextDueDate) {
        return recurringExpense.getEndDate() != null
                && runDate.isAfter(recurringExpense.getEndDate())
                && nextDueDate != null
                && nextDueDate.isAfter(recurringExpense.getEndDate());
    }

    private LocalDate resolveNextDueDate(RecurringExpense recurringExpense) {
        if (recurringExpense.getEndDate() != null && recurringExpense.getStartDate().isAfter(recurringExpense.getEndDate())) {
            recurringExpense.setActive(false);
            recurringExpenseRepository.save(recurringExpense);
            return null;
        }

        if (recurringExpense.getLastGenerated() == null) {
            return recurringExpense.getStartDate();
        }

        LocalDate nextDueDate = nextOccurrence(recurringExpense.getLastGenerated(), recurringExpense.getFrequency());
        return nextDueDate.isBefore(recurringExpense.getStartDate()) ? recurringExpense.getStartDate() : nextDueDate;
    }

    private boolean isWithinEndDate(RecurringExpense recurringExpense, LocalDate dueDate) {
        return recurringExpense.getEndDate() == null || !dueDate.isAfter(recurringExpense.getEndDate());
    }

    private LocalDate nextOccurrence(LocalDate date, RecurringExpense.Frequency frequency) {
        return switch (frequency) {
            case DAILY -> date.plusDays(1);
            case WEEKLY -> date.plusWeeks(1);
            case MONTHLY -> date.plusMonths(1);
            case YEARLY -> date.plusYears(1);
        };
    }

    private void validateAmount(Double amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }
    }

    private RecurringExpenseResponse toResponse(RecurringExpense recurringExpense) {
        return new RecurringExpenseResponse(
                recurringExpense.getId(),
                recurringExpense.getAmount().doubleValue(),
                recurringExpense.getCategory(),
                recurringExpense.getDescription(),
                recurringExpense.getFrequency(),
                recurringExpense.getStartDate(),
                recurringExpense.getEndDate(),
                recurringExpense.getLastGenerated(),
                recurringExpense.isActive()
        );
    }
}
