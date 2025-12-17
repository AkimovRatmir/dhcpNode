import { DhcpPacket } from "./dhcp.types";

function ip(buf: Buffer, offset: number): string {
  return `${buf[offset]}.${buf[offset + 1]}.${buf[offset + 2]}.${buf[offset + 3]}`;
}

function mac(buf: Buffer): string {
  return [...buf].map(b => b.toString(16).padStart(2, "0")).join(":");
}

export function decodeDhcpPacket(msg: Buffer): DhcpPacket {
  const options = new Map<number, Buffer>();

  // Fixed header
  const packet: DhcpPacket = {
    op: msg.readUInt8(0),
    htype: msg.readUInt8(1),
    hlen: msg.readUInt8(2),
    hops: msg.readUInt8(3),
    xid: msg.readUInt32BE(4),
    secs: msg.readUInt16BE(8),
    flags: msg.readUInt16BE(10),
    ciaddr: ip(msg, 12),
    yiaddr: ip(msg, 16),
    siaddr: ip(msg, 20),
    giaddr: ip(msg, 24),
    chaddr: mac(msg.subarray(28, 28 + msg.readUInt8(2))),
    options,
  };

  // Magic cookie check
  const magic = msg.readUInt32BE(236);
  if (magic !== 0x63825363) {
    throw new Error("Invalid DHCP magic cookie");
  }

  // Options parsing (TLV)
  let offset = 240;
  while (offset < msg.length) {
    const code = msg.readUInt8(offset++);
    if (code === 0) continue;        // Pad
    if (code === 255) break;         // End

    const len = msg.readUInt8(offset++);
    const value = msg.subarray(offset, offset + len);
    offset += len;

    options.set(code, value);
  }

  return packet;
}
