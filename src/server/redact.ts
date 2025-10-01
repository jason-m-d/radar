const EMAIL_MASK = /([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+)/g;

export function maskEmail(address: string): string {
  return address.replace(EMAIL_MASK, (_, local: string, domain: string) => {
    if (!local) return `*@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  });
}

export function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return maskEmail(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redactValue(entry)]),
    );
  }

  return value;
}

type LogData = Record<string, unknown>;

export function safeLog(prefix: string, data: LogData): void {
  const redacted = redactValue(data) as LogData;
  console.info(prefix, redacted);
}
