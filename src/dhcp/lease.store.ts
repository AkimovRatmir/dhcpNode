import { Lease, LeaseState } from "./lease.types";

export class LeaseStore {
  private leases = new Map<string, Lease>();

  getByMac(mac: string): Lease | undefined {
    return this.leases.get(mac);
  }

  offer(mac: string, ip: string, xid: number, ttlSeconds: number): Lease {
    const lease: Lease = {
      mac,
      ip,
      xid,
      state: LeaseState.Offered,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    this.leases.set(mac, lease);
    return lease;
  }

  bind(mac: string, xid: number): Lease | undefined {
    const lease = this.leases.get(mac);
    if (!lease) return;

    lease.state = LeaseState.Bound;
    lease.xid = xid;
    return lease;
  }
}
