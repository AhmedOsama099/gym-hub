/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // تفعيل التحقق التلقائي من صحة المدخلات وتنظيف البيانات غير المعرفة
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //DTO يتجاهل أي حقل إضافي يرسله المستخدم غير موجود في الـ
      forbidNonWhitelisted: true, // يرجع خطأ لو تم إرسال حقول غير مسموحة
      transform: true, // (مثل string إلى number إن تطلب الأمر) يحول الأنواع تلقائياً
    }),
  );

  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: "http://localhost:4200", // عنوان تطبيق Angular
    credentials: true, // ضروري جداً لتبادل Cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
