import { PoolConfig, ReservationConfig } from "./pool.types";

export const POOLS: PoolConfig[] = [
  {
    name: "main",
    startIp: "192.168.2.100",
    endIp: "192.168.2.200",
    subnetMask: "255.255.255.0",
    router: "192.168.2.253",          // Option 3
    dns: ["192.168.2.253"],
    leaseTimeSec: 3600,
  },
];

export const RESERVATIONS: ReservationConfig[] = [
  // Example:
  // { mac: "1a:b0:76:8f:e5:8a", ip: "192.168.8.110" },
];
