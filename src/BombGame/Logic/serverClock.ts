// Anchor server time to a monotonic clock so device clock changes cannot alter a round.
export class ServerClock {
  private anchor: { server: number; local: number } | null = null;
  private calibrated = false;

  observe(server: number, received = performance.now()): void {
    if (!this.calibrated && Number.isFinite(server)) this.anchor = { server, local: received };
  }

  synchronize(server: number, sent: number, received = performance.now()): void {
    if (!Number.isFinite(server) || received < sent) return;
    this.anchor = { server: server + (received - sent) / 2, local: received };
    this.calibrated = true;
  }

  now(local = performance.now()): number {
    return this.anchor ? this.anchor.server + local - this.anchor.local : Date.now();
  }

  reset(): void { this.anchor = null; this.calibrated = false; }
}

export const bombServerClock = new ServerClock();
