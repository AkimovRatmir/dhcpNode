import { Lease, LeaseState } from "./lease.types";

export class LeaseStore {
  private byMac = new Map<string, Lease>();
  private byIp = new Map<string, string>(); // ip -> mac

  getByMac(mac: string): Lease | undefined {
    return this.byMac.get(mac);
  }

  isIpTaken(ip: string): boolean {
    return this.byIp.has(ip);
  }

  whoHasIp(ip: string): string | undefined {
    return this.byIp.get(ip);
  }

  offer(mac: string, ip: string, xid: number, ttlSeconds: number): Lease {
    // If someone else has this IP, refuse (caller must pick another IP)
    const owner = this.byIp.get(ip);
    if (owner && owner !== mac) {
      throw new Error(`IP ${ip} already leased to ${owner}`);
    }

    const lease: Lease = {
      mac,
      ip,
      xid,
      state: LeaseState.Offered,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    this.byMac.set(mac, lease);
    this.byIp.set(ip, mac);
    return lease;
  }

  bind(mac: string, xid: number): Lease | undefined {
    const lease = this.byMac.get(mac);
    if (!lease) return;

    lease.state = LeaseState.Bound;
    lease.xid = xid;
    return lease;
  }
}
