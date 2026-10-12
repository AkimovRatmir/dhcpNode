# dhcpNode: a DHCP server written from scratch in Node.js

A working DHCP server built on raw UDP sockets in TypeScript (NestJS), without any DHCP library.
It hands out IP addresses on a real local network and can point clients to a PXE boot server for
network booting.

It's a learning and prototype project: I wrote it to understand the protocol at the byte level.

## What it does

- **Speaks DHCP on the wire.** It listens on UDP port 67 and decodes and encodes BOOTP/DHCP packets
  by hand (RFC 2131 / RFC 2132): the 236-byte fixed header, the magic cookie and the TLV options.
- **Full handshake:** DHCPDISCOVER → DHCPOFFER, DHCPREQUEST → DHCPACK, replying by broadcast to
  port 68.
- **Address pools.** It allocates addresses from configurable ranges and sends the subnet mask
  (option 1), router (option 3), DNS servers (option 6), lease time (option 51) and server
  identifier (option 54).
- **Static reservations.** A fixed IP for a given MAC address.
- **Lease tracking.** Offered and bound leases are kept per client MAC and transaction ID, so a
  client gets the same address back.
- **PXE network boot.** It sends the boot server (option 66) and the boot file name (option 67,
  e.g. `ipxe.efi`), so machines can boot over the network.

## Structure

| File | Role |
|---|---|
| `src/dhcp/dhcp.service.ts` | UDP socket, message handling, replies |
| `src/dhcp/dhcp.decoder.ts` | Raw packet → typed DHCP packet |
| `src/dhcp/dhcp.encoder.ts` | DHCPOFFER / DHCPACK builder, options as TLV |
| `src/dhcp/ip.allocator.ts` | Picks a free address from a pool or a reservation |
| `src/dhcp/lease.store.ts` | In-memory leases by MAC |
| `src/dhcp/ip.util.ts` | IPv4 ↔ integer helpers, range checks |
| `src/dhcp/dhcp.runtime-config.ts` | Pools, reservations, PXE settings |

## Running it

Requires Node.js 18+. Port 67 is privileged, so the server needs root. Run it on an isolated test
network, or turn off your router's DHCP first: two DHCP servers on one network will fight.

```bash
npm install
# set your network in src/dhcp/dhcp.runtime-config.ts
# and the server's own IP (serverId) in src/dhcp/dhcp.service.ts
sudo npm run start:dev
```

## Not done yet

Leases live in memory only. There's no DHCPRELEASE / DHCPDECLINE / DHCPNAK handling, unicast
replies or relay-agent support.

## Author

**Ratmir Akimov**: [github.com/AkimovRatmir](https://github.com/AkimovRatmir)

## License

All rights reserved. The code is published for viewing only. See [LICENSE](LICENSE).
