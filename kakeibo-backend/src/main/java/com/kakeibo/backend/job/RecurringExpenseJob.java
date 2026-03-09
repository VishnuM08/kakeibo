package com.kakeibo.backend.job;

import com.kakeibo.backend.service.RecurringExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class RecurringExpenseJob {

    private final RecurringExpenseService recurringExpenseService;

    @Scheduled(cron = "0 0 0 * * ?") // Run every day at midnight
    public void createExpensesFromRecurring() {
        recurringExpenseService.generateDueExpenses(LocalDate.now());
    }
}
