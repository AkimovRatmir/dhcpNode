export enum LeaseState {
  Offered = "OFFERED",
  Bound = "BOUND",
}

export interface Lease {
  mac: string;
  ip: string;
  xid: number;
  state: LeaseState;
  expiresAt: number;
}
