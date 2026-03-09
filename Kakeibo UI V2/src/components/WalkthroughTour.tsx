import React, { useEffect, useState } from "react";
import Joyride, { CallBackProps, EVENTS, STATUS, Step } from "react-joyride";
import { motion } from "framer-motion";

interface WalkthroughTourProps {
  isDarkMode?: boolean;
  onTourStateChange?: (isActive: boolean) => void;
}

export function WalkthroughTour({
  isDarkMode = false,
  onTourStateChange,
}: WalkthroughTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (onTourStateChange) {
      onTourStateChange(run);
    }
  }, [run, onTourStateChange]);

  // Animation variants for the tooltip content
  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  // Define the tour steps in chronological order from top to bottom
  const steps: Step[] = [
    {
      target: "body",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h2 className="text-xl font-bold mb-2">Welcome to Kakeibo</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            Welcome to a premium, simple approach to personal finance. This
            quick tour will show you how to take control of your money.
          </p>
        </motion.div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".analytics-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Visual Analytics</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            View clear, simple charts to understand exactly where your money
            goes each month.
          </p>
        </motion.div>
      ),
      placement: "bottom",
    },
    {
      target: ".dashboard-overview",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Monthly Overview</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            See your total spending for the current month at a single glance.
          </p>
        </motion.div>
      ),
      placement: "bottom",
    },
    {
      target: ".budget-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Smart Budgets</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Set a monthly spending limit. We'll track your pace and warn you
            before you overspend.
          </p>
        </motion.div>
      ),
      placement: "bottom",
    },

    {
      target: ".add-expense-btn",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Add Expenses</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Quickly log your purchases and categorize them to keep your records
            accurate.
          </p>
        </motion.div>
      ),
      placement: "top",
    },
    {
      target: ".savings-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Savings Goals</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Set clear targets, like a vacation or an emergency fund, and watch
            your savings grow.
          </p>
        </motion.div>
      ),
      placement: "bottom",
    },
    {
      target: ".export-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Export Data</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Download all your financial records into a spreadsheet whenever you
            need them.
          </p>
        </motion.div>
      ),
      placement: "bottom",
    },
    {
      target: ".search-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Search</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Looking for a specific purchase? Easily search your entire
            transaction history.
          </p>
        </motion.div>
      ),
      placement: "bottom",
    },
    {
      target: ".todays-expenses-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Today's Log</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Review and easily edit the expenses you've entered today.
          </p>
        </motion.div>
      ),
      placement: "top",
    },
    {
      target: ".calendar-section",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h3 className="text-lg font-bold mb-1">Calendar</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            View your spending day-by-day to see exactly when you spent the most
            money.
          </p>
        </motion.div>
      ),
      placement: "top",
    },
    {
      target: "body",
      content: (
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="text-left"
        >
          <h2 className="text-xl font-bold mb-2">You're All Set!</h2>
          <p className="text-sm opacity-80 leading-relaxed">
            You are ready to use Kakeibo. If you ever want to see this tour
            again, just open the Settings menu.
          </p>
        </motion.div>
      ),
      placement: "center",
    },
  ];

  useEffect(() => {
    // Check if the tour has already been completed
    const hasCompletedTour = localStorage.getItem("kakeiboTourCompleted");

    // Check if a manual run was requested via an event
    const handleStartTourEvent = () => {
      setRun(true);
    };

    window.addEventListener("startWalkthroughTour", handleStartTourEvent);

    if (!hasCompletedTour) {
      // Small delay to ensure the DOM is fully painted
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener(
          "startWalkthroughTour",
          handleStartTourEvent,
        );
      };
    }

    return () => {
      window.removeEventListener("startWalkthroughTour", handleStartTourEvent);
    };
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Check if we are moving TO the Calendar step (index 9)
    if (type === "step:after" && action === "next" && index === 8) {
      window.dispatchEvent(
        new CustomEvent("walkthroughAction", {
          detail: { action: "openCalendar" },
        }),
      );
    }

    // Also handle case where someone skips directly to it, though less likely
    if (type === EVENTS.TOOLTIP && index === 9) {
      window.dispatchEvent(
        new CustomEvent("walkthroughAction", {
          detail: { action: "openCalendar" },
        }),
      );
    }

    // If the tour is finished or skipped, mark it as completed
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("kakeiboTourCompleted", "true");
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#007aff",
          backgroundColor: isDarkMode ? "#1c1c1e" : "#ffffff",
          textColor: isDarkMode ? "#ffffff" : "#000000",
          arrowColor: isDarkMode ? "#1c1c1e" : "#ffffff",
          overlayColor: isDarkMode
            ? "rgba(0, 0, 0, 0.7)"
            : "rgba(0, 0, 0, 0.5)",
        },
        tooltip: {
          borderRadius: "16px",
          padding: "20px",
          boxShadow: isDarkMode
            ? "0 10px 40px rgba(0, 0, 0, 0.5)"
            : "0 10px 40px rgba(0, 0, 0, 0.1)",
        },
        buttonNext: {
          borderRadius: "8px",
          padding: "8px 16px",
          fontWeight: "bold",
        },
        buttonBack: {
          color: isDarkMode ? "#8e8e93" : "#8e8e93",
          marginRight: "10px",
        },
        buttonSkip: {
          color: isDarkMode ? "#8e8e93" : "#8e8e93",
        },
      }}
    />
  );
}
