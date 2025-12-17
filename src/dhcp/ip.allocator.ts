import { LeaseStore } from "./lease.store";
import { PoolConfig, ReservationConfig } from "./pool.types";
import { intToIp, ipToInt, isIpInRange } from "./ip.util";

export class IpAllocator {
  constructor(
    private readonly leaseStore: LeaseStore,
    private readonly pools: PoolConfig[],
    private readonly reservations: ReservationConfig[],
  ) {
    if (!pools.length) throw new Error("No pools configured");
  }

  getReservation(mac: string): ReservationConfig | undefined {
    return this.reservations.find(r => r.mac.toLowerCase() === mac.toLowerCase());
  }

  allocateForMac(mac: string): { ip: string; pool: PoolConfig } {
    // 1) Reservation overrides everything
    const res = this.getReservation(mac);
    if (res) {
      // Ensure reserved IP is not taken by someone else
      const owner = this.leaseStore.whoHasIp(res.ip);
      if (owner && owner !== mac) {
        throw new Error(`Reserved IP ${res.ip} is already used by ${owner}`);
      }

      // Find a pool that contains this IP (for options)
      const pool = this.pools.find(p => isIpInRange(res.ip, p.startIp, p.endIp));
      if (!pool) {
        throw new Error(`Reserved IP ${res.ip} is not inside any configured pool`);
      }

      return { ip: res.ip, pool };
    }

    // 2) Reuse existing lease IP (PXE-safe)
    const existing = this.leaseStore.getByMac(mac);
    if (existing) {
      const pool = this.pools.find(p => isIpInRange(existing.ip, p.startIp, p.endIp));
      if (!pool) throw new Error(`Existing lease IP ${existing.ip} not inside any pool`);
      return { ip: existing.ip, pool };
    }

    // 3) Find first free IP in pools (simple sequential)
    for (const pool of this.pools) {
      const start = ipToInt(pool.startIp);
      const end = ipToInt(pool.endIp);

      for (let n = start; n <= end; n++) {
        const candidate = intToIp(n);
        if (!this.leaseStore.isIpTaken(candidate)) {
          return { ip: candidate, pool };
        }
      }
    }

    throw new Error("No free IPs available in pools");
  }
}
