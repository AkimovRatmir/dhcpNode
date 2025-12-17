export enum DhcpMessageType {
  Discover = 1,
  Offer = 2,
  Request = 3,
  Decline = 4,
  Ack = 5,
  Nak = 6,
  Release = 7,
  Inform = 8,
}

export interface DhcpPacket {
  op: number;
  htype: number;
  hlen: number;
  hops: number;
  xid: number;
  secs: number;
  flags: number;
  ciaddr: string;
  yiaddr: string;
  siaddr: string;
  giaddr: string;
  chaddr: string;
  options: Map<number, Buffer>;
}
