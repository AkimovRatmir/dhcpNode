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
  // { mac: "aa:bb:cc:dd:ee:ff", ip: "192.168.8.110" },
];

export const PXE = {
  nextServer: "192.168.2.1",   // Option 66
  bootFile: "ipxe.efi",        // Option 67
};
