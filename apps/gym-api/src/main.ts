import * as dotenv from "dotenv";
import * as path from "path";

// Load local .env if available
dotenv.config({ path: path.resolve(process.cwd(), "apps/gym-api/.env") });
dotenv.config();

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import cookieParser from "cookie-parser";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { Express } from "express";

let appInstance: any = null;
let initPromise: Promise<any> | null = null;

export async function bootstrapNestServer() {
  if (appInstance) return appInstance.getHttpAdapter().getInstance();
  if (!initPromise) {
    initPromise = (async () => {
      const app = await NestFactory.create(AppModule);
      app.use(cookieParser());

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      const globalPrefix = "api";
      app.setGlobalPrefix(globalPrefix);

      app.enableCors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      });

      await app.init();
      appInstance = app;
      return app.getHttpAdapter().getInstance();
    })();
  }
  return initPromise;
}

// Standalone mode: when running via nx serve or direct node execution
if (!process.env.VERCEL && require.main === module) {
  bootstrapNestServer().then((expressInstance) => {
    const port = process.env.PORT || 3000;
    expressInstance.listen(Number(port), "0.0.0.0", () => {
      Logger.log(
        `🚀 Application is running on: http://localhost:${port}/api`,
      );
    });
  });
}

// Default export for Vercel Serverless Function
export default async function handler(req: any, res: any) {
  const app = await bootstrapNestServer();
  app(req, res);
}
