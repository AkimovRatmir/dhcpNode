import { DhcpMessageType, DhcpPacket } from "./dhcp.types";

function ipToBuf(ip: string): Buffer {
  return Buffer.from(ip.split(".").map((x) => parseInt(x, 10)));
}

function macToBuf(mac: string): Buffer {
  return Buffer.from(mac.split(":").map((x) => parseInt(x, 16)));
}

function writeOption(code: number, data: Buffer): Buffer {
  return Buffer.concat([Buffer.from([code, data.length]), data]);
}

/**
 * Builds a DHCP reply (OFFER/ACK/etc) based on a received packet.
 * Fixed header = 236 bytes, then magic cookie + options.
 */
export function buildDhcpReply(params: {
  request: DhcpPacket;
  messageType: DhcpMessageType;
  yiaddr: string;       // "your" IP for client
  serverId: string;     // option 54
  leaseTimeSec: number; // option 51

  subnetMask?: string;  // option 1
  router?: string;      // option 3
  dns?: string[];       // option 6
}): Buffer {
  const {
    request,
    messageType,
    yiaddr,
    serverId,
    leaseTimeSec,
    subnetMask,
    router,
    dns,
  } = params;

  // --- Fixed header (236 bytes) ---
  const buf = Buffer.alloc(236, 0);

  // op: 2 = BOOTREPLY
  buf.writeUInt8(2, 0);

  // htype/hlen/hops copied
  buf.writeUInt8(request.htype, 1);
  buf.writeUInt8(request.hlen, 2);
  buf.writeUInt8(request.hops, 3);

  // xid copied
  buf.writeUInt32BE(request.xid, 4);

  // secs copied
  buf.writeUInt16BE(request.secs, 8);

  // flags copied (broadcast flag matters)
  buf.writeUInt16BE(request.flags, 10);

  // ciaddr = 0.0.0.0 in replies for initial allocation
  ipToBuf("0.0.0.0").copy(buf, 12);

  // yiaddr = offered/assigned IP
  ipToBuf(yiaddr).copy(buf, 16);

  // siaddr = server IP (often set to server identifier)
  ipToBuf(serverId).copy(buf, 20);

  // giaddr copied (relay)
  ipToBuf(request.giaddr).copy(buf, 24);

  // chaddr (16 bytes) - put client MAC then pad
  const ch = Buffer.alloc(16, 0);
  macToBuf(request.chaddr).copy(ch, 0);
  ch.copy(buf, 28);

  // sname (64) and file (128) left as zeros for now

  // --- Magic cookie + options ---
  const magic = Buffer.from([0x63, 0x82, 0x53, 0x63]);

  const options: Buffer[] = [];

  // 53: DHCP message type
  options.push(writeOption(53, Buffer.from([messageType])));

  // 54: server identifier
  options.push(writeOption(54, ipToBuf(serverId)));

  // 51: lease time
  const lt = Buffer.alloc(4);
  lt.writeUInt32BE(leaseTimeSec, 0);
  options.push(writeOption(51, lt));

  // Optional but very common: subnet mask, router, DNS
  if (subnetMask) options.push(writeOption(1, ipToBuf(subnetMask)));
  if (router) options.push(writeOption(3, ipToBuf(router)));
  if (dns?.length) {
    options.push(writeOption(6, Buffer.concat(dns.map(ipToBuf))));
  }

  // 255: end
  options.push(Buffer.from([255]));

  return Buffer.concat([buf, magic, ...options]);
}
