import { useState, useCallback } from "react";

const TOUR_STORAGE_KEY = "wazuh_todo_tour_completed";

/**
 * Hook to manage the application tour state
 * Uses localStorage to persist whether the user has completed the tour
 */
export function useTour() {
  // Initialize state from localStorage
  const [isTourActive, setIsTourActive] = useState(() => {
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) !== "true";
    } catch {
      // If localStorage is not available, don't show tour
      return false;
    }
  });

  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Complete the tour and save to localStorage
   */
  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // Ignore localStorage errors
    }
    setIsTourActive(false);
    setCurrentStep(0);
  }, []);

  /**
   * Skip/dismiss the tour
   */
  const dismissTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  /**
   * Go to previous step
   */
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  /**
   * Reset the tour (for testing or user request)
   */
  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
    setIsTourActive(true);
    setCurrentStep(0);
  }, []);

  /**
   * Start the tour manually
   */
  const startTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentStep(0);
  }, []);

  return {
    isTourActive,
    currentStep,
    setCurrentStep,
    completeTour,
    dismissTour,
    nextStep,
    prevStep,
    resetTour,
    startTour,
  };
}
