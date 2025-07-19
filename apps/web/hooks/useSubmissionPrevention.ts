import { useState, useCallback, useRef } from 'react';

export interface SubmissionState {
  isSubmitting: boolean;
  lastSubmissionTime: number | null;
  submissionCount: number;
}

export interface UseSubmissionPreventionOptions {
  cooldownMs?: number;
  maxSubmissions?: number;
  resetAfterMs?: number;
}

export function useSubmissionPrevention(options: UseSubmissionPreventionOptions = {}) {
  const {
    cooldownMs = 1000,
    maxSubmissions = 5,
    resetAfterMs = 60000, // 1 minute
  } = options;

  const [state, setState] = useState<SubmissionState>({
    isSubmitting: false,
    lastSubmissionTime: null,
    submissionCount: 0,
  });

  const resetTimeoutRef = useRef<NodeJS.Timeout>();

  const canSubmit = useCallback(() => {
    const now = Date.now();
    
    // Check if still in cooldown
    if (state.lastSubmissionTime && (now - state.lastSubmissionTime) < cooldownMs) {
      return false;
    }

    // Check if max submissions reached
    if (state.submissionCount >= maxSubmissions) {
      return false;
    }

    // Check if currently submitting
    if (state.isSubmitting) {
      return false;
    }

    return true;
  }, [state, cooldownMs, maxSubmissions]);

  const startSubmission = useCallback(() => {
    if (!canSubmit()) {
      return false;
    }

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      lastSubmissionTime: Date.now(),
      submissionCount: prev.submissionCount + 1,
    }));

    // Clear existing reset timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Set new reset timeout
    resetTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        submissionCount: 0,
      }));
    }, resetAfterMs);

    return true;
  }, [canSubmit, resetAfterMs]);

  const endSubmission = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSubmitting: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      lastSubmissionTime: null,
      submissionCount: 0,
    });

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
  }, []);

  const getRemainingCooldown = useCallback(() => {
    if (!state.lastSubmissionTime) return 0;
    
    const elapsed = Date.now() - state.lastSubmissionTime;
    return Math.max(0, cooldownMs - elapsed);
  }, [state.lastSubmissionTime, cooldownMs]);

  const getRemainingSubmissions = useCallback(() => {
    return Math.max(0, maxSubmissions - state.submissionCount);
  }, [state.submissionCount, maxSubmissions]);

  return {
    isSubmitting: state.isSubmitting,
    canSubmit: canSubmit(),
    submissionCount: state.submissionCount,
    startSubmission,
    endSubmission,
    reset,
    getRemainingCooldown,
    getRemainingSubmissions,
  };
}