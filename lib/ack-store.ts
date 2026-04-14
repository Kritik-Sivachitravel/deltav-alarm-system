type AckRecord = { ackedAt: string; ackedBy: string };

const _store = new Map<string, AckRecord>();
const _listeners = new Set<() => void>();

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

export function acknowledgeIncident(id: string, ackedBy: string = "J. Meyers"): void {
  const ackedAt = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  _store.set(id, { ackedAt, ackedBy });
  _notify();
}

export function isAcknowledged(id: string): boolean {
  return _store.has(id);
}

export function getAcknowledgment(id: string): AckRecord | undefined {
  return _store.get(id);
}

export function getAcknowledgedIds(): string[] {
  return Array.from(_store.keys());
}

export function subscribe(listener: () => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

export function resetStore(): void {
  _store.clear();
  _notify();
}
