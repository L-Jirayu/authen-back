// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ready')
  async ready() {
    const state = this.conn.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting

    // ⛑️ กันกรณี db ยังไม่พร้อม (TS ก็หาย error)
    if (!this.conn || !this.conn.db) {
      return { dbConnected: false, state, error: 'DB handle not ready yet' };
    }

    try {
      await this.conn.db.admin().command({ ping: 1 });
      return { dbConnected: true, state };
    } catch (e: any) {
      return { dbConnected: false, state, error: e?.message ?? 'ping failed' };
    }
  }
}
