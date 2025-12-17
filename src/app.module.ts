import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DhcpModule } from './dhcp/dhcp.module';

@Module({
  imports: [DhcpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
