const PULSE_CLASS = "radar-target-pulse";
const PULSE_DURATION_MS = 650;
const FADE_DURATION_MS = 300;

function sanitizeAttributeValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function queryElement(attribute: string, identifier: string | null | undefined): HTMLElement | null {
  if (typeof window === "undefined" || typeof identifier !== "string" || identifier.trim().length === 0) {
    return null;
  }

  const selector = `[${attribute}="${sanitizeAttributeValue(identifier)}"]`;
  return document.querySelector(selector) as HTMLElement | null;
}

function pulseTarget(element: HTMLElement) {
  element.classList.add(PULSE_CLASS);
  window.setTimeout(() => {
    element.classList.remove(PULSE_CLASS);
  }, PULSE_DURATION_MS);
}

function fadeSource(element: HTMLElement) {
  const previousTransition = element.style.transition;
  const previousOpacity = element.style.opacity;

  element.style.transition = previousTransition.length ? `${previousTransition}, opacity 250ms ease` : "opacity 250ms ease";
  element.style.opacity = "0.35";

  window.setTimeout(() => {
    element.style.opacity = previousOpacity;
    element.style.transition = previousTransition;
  }, FADE_DURATION_MS);
}

export function animateDataFlow(messageId: string | null | undefined, taskId: string | null | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  const targetElement = queryElement("data-task-id", taskId);
  if (targetElement) {
    pulseTarget(targetElement);
  }

  const sourceElement = queryElement("data-message-id", messageId);
  if (sourceElement) {
    fadeSource(sourceElement);
  }
}
