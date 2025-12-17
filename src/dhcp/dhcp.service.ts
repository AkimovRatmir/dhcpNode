import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import dgram from "dgram";
import { decodeDhcpPacket } from "./dhcp.decoder";
import { DhcpMessageType } from "./dhcp.types";
import { LeaseStore } from "./lease.store";
import { buildDhcpReply } from "./dhcp.encoder";
import { IpAllocator } from "./ip.allocator";
import { POOLS, RESERVATIONS } from "./dhcp.runtime-config";
import { PXE } from "./dhcp.runtime-config";



@Injectable()
export class DhcpService implements OnModuleInit {
    private readonly logger = new Logger(DhcpService.name);
    private socket = dgram.createSocket("udp4");
    private leaseStore = new LeaseStore();

    private readonly serverId = "192.168.8.200";  // CHANGE to your Mac/Server IP for real network tests
    private readonly leaseTimeSec = 60;

    private readonly subnetMask = "255.255.255.0";
    private readonly router = "192.168.8.1";
    private readonly dns = ["8.8.8.8"];

    private allocator = new IpAllocator(this.leaseStore, POOLS, RESERVATIONS);

    private sendDhcpReply(payload: Buffer, rinfoAddress: string, flags: number) {
        const BROADCAST_FLAG = 0x8000;

        // Safe logic:
        // - If request came from 127.0.0.1 (our safe test), reply unicast to it.
        // - If broadcast flag set, broadcast to 255.255.255.255:68.
        // - Otherwise (later), we’ll support unicast-to-client-ip; for now broadcast is acceptable.
        const isLocalhost = rinfoAddress === "127.0.0.1";
        const wantsBroadcast = (flags & BROADCAST_FLAG) !== 0;

        const targetAddress = isLocalhost
            ? "127.0.0.1"
            : wantsBroadcast
                ? "255.255.255.255"
                : "255.255.255.255";

        this.socket.send(payload, 68, targetAddress, (err) => {
            if (err) this.logger.error(`send() failed: ${err.message}`);
        });
    }


    onModuleInit() {
        this.start();
    }

    private start() {
        this.socket.on("error", (err) => {
            this.logger.error(`Socket error: ${err.message}`, err.stack);
        });

        this.socket.on("message", (msg, rinfo) => {
            try {
                const packet = decodeDhcpPacket(msg);
                const msgType = packet.options.get(53)?.readUInt8(0);

                if (msgType === DhcpMessageType.Discover) {
                    const { ip, pool } = this.allocator.allocateForMac(packet.chaddr);

                    let lease = this.leaseStore.getByMac(packet.chaddr);
                    if (!lease) {
                        lease = this.leaseStore.offer(packet.chaddr, ip, packet.xid, pool.leaseTimeSec);
                    } else {
                        lease.xid = packet.xid;
                    }

                    const offer = buildDhcpReply({
                        request: packet,
                        messageType: DhcpMessageType.Offer,
                        yiaddr: lease.ip,
                        serverId: this.serverId,
                        leaseTimeSec: pool.leaseTimeSec,
                        subnetMask: pool.subnetMask,
                        router: pool.router,
                        dns: pool.dns,

                        // PXE OPTIONS
                        pxeNextServer: PXE.nextServer,
                        pxeBootFile: PXE.bootFile,
                    });


                    this.sendDhcpReply(offer, rinfo.address, packet.flags);
                    this.logger.log(`OFFER sent ${lease.mac} -> ${lease.ip}`);
                }


                if (msgType === DhcpMessageType.Request) {
                    const lease = this.leaseStore.getByMac(packet.chaddr);
                    if (!lease) return;

                    // find pool for this lease (options)
                    const pool = POOLS.find(p => {
                        const { isIpInRange } = require("./ip.util"); // quick import avoidance
                        return isIpInRange(lease.ip, p.startIp, p.endIp);
                    }) ?? POOLS[0];

                    this.leaseStore.bind(packet.chaddr, packet.xid);

                    const ack = buildDhcpReply({
                        request: packet,
                        messageType: DhcpMessageType.Ack,
                        yiaddr: lease.ip,
                        serverId: this.serverId,
                        leaseTimeSec: pool.leaseTimeSec,
                        subnetMask: pool.subnetMask,
                        router: pool.router,
                        dns: pool.dns,

                        // PXE OPTIONS
                        pxeNextServer: PXE.nextServer,
                        pxeBootFile: PXE.bootFile,
                    });


                    this.sendDhcpReply(ack, rinfo.address, packet.flags);
                    this.logger.log(`ACK sent ${lease.mac} -> ${lease.ip}`);
                }

            } catch (e) {
                this.logger.warn(`Invalid DHCP packet: ${e.message}`);
            }
        });




        this.socket.on("listening", () => {
            const addr = this.socket.address();
            this.logger.log(
                `DHCP server listening on ${addr.address}:${addr.port}`,
            );
        });

        /**
         * Important:
         * - 0.0.0.0 to receive broadcasts
         * - port 67 = DHCP server
         */
        this.socket.bind(67, "0.0.0.0", () => {
            this.socket.setBroadcast(true);
        });
    }
}
