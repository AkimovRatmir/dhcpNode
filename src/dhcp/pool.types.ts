export interface PoolConfig {
  name: string;
  startIp: string;
  endIp: string;

  subnetMask: string;
  router: string;
  dns: string[];

  leaseTimeSec: number;
}

export interface ReservationConfig {
  mac: string; // "aa:bb:cc:dd:ee:ff"
  ip: string;
}
