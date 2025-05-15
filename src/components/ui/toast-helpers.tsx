
import React from "react";
import { ToastAction, ToastActionElement } from "@/components/ui/toast";

/**
 * Creates a properly typed ToastAction element for use with the toast system
 * @param onClick Function to execute when action is clicked
 * @param altText Alternative text for accessibility
 * @param children Content of the action button
 * @returns A properly typed ToastActionElement
 */
export function createToastAction(
  onClick: () => void,
  altText: string,
  children: React.ReactNode
): ToastActionElement {
  return (
    <ToastAction onClick={onClick} altText={altText}>
      {children}
    </ToastAction>
  ) as ToastActionElement;
}

/**
 * Creates a retry action element for toast notifications
 * @param onRetry Function to execute when retry is clicked
 * @returns A ToastActionElement for retrying an operation
 */
export function createRetryAction(onRetry: () => void): ToastActionElement {
  return createToastAction(onRetry, "Retry action", "Retry");
}
