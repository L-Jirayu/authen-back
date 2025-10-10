import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // เปลี่ยนจาก /health → /ready เพื่อเช็กระบบจริง
  @Get('ready')
  async ready() {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const state = connection.readyState;
    return { dbConnected: state === 1, state };
  }
}
