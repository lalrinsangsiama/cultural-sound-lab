"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

let toastState: ToastState = { toasts: [] };
const listeners: Set<(state: ToastState) => void> = new Set();

function dispatch(action: { type: string; payload?: unknown }) {
  switch (action.type) {
    case "ADD_TOAST":
      toastState.toasts = [...toastState.toasts, action.payload as Toast];
      break;
    case "REMOVE_TOAST":
      toastState.toasts = toastState.toasts.filter(t => t.id !== action.payload);
      break;
    case "CLEAR_TOASTS":
      toastState.toasts = [];
      break;
  }
  
  listeners.forEach(listener => listener(toastState));
}

export function toast(props: Omit<Toast, "id">) {
  const id = Date.now().toString();
  const toastItem: Toast = {
    id,
    ...props,
    duration: props.duration ?? 3000,
  };
  
  dispatch({ type: "ADD_TOAST", payload: toastItem });
  
  if (toastItem.duration && toastItem.duration > 0) {
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    }, toastItem.duration);
  }
  
  return id;
}

export function useToast() {
  const [state, setState] = useState<ToastState>(toastState);
  
  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  
  const unsubscribe = useCallback(() => {
    setState(toastState);
  }, []);
  
  // Subscribe to state changes
  useState(() => {
    const unsub = subscribe(setState);
    return unsub;
  });
  
  const dismiss = useCallback((toastId: string) => {
    dispatch({ type: "REMOVE_TOAST", payload: toastId });
  }, []);
  
  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}