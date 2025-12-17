import { Module } from "@nestjs/common";
import { DhcpService } from "./dhcp.service";

@Module({
  providers: [DhcpService],
})
export class DhcpModule {}
