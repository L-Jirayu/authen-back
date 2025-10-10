import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
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

  // ✅ /health ตอบได้ทันที ใช้ให้ Render เช็ก (ไม่รอ DB/Session/Nest init)
  expressApp.get('/health', (_req: any, res: any) => {
    res.status(200).json({ ok: true });
  });

  app.enableCors({
    origin: ['https://minifeed.vercel.app', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'change_this_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
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

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
