import { PoolConfig, ReservationConfig } from "./pool.types";

export const POOLS: PoolConfig[] = [
  {
    name: "main",
    startIp: "192.168.8.100",
    endIp: "192.168.8.200",
    subnetMask: "255.255.255.0",
    router: "192.168.8.1",
    dns: ["8.8.8.8"],
    leaseTimeSec: 3600,
  },
];

export const RESERVATIONS: ReservationConfig[] = [
  // Example:
  // { mac: "1a:b0:76:8f:e5:8a", ip: "192.168.8.110" },
];
