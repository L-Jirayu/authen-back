// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
// ✅ ใช้ require แทน เพื่อเลี่ยง undefined
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo');
import { join } from 'path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'change_this_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,   // อย่าลืมตั้ง ENV นี้
        collectionName: 'sessions',
        ttl: 60 * 60 * 24 * 7,
      }),
      cookie: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
      name: 'sid',
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.enableCors({
    origin: ['https://minifeed.vercel.app', 'http://localhost:5173'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
