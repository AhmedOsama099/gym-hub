import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const connectionString =
      process.env["DATABASE_URL"] ||
      process.env["POSTGRES_URL"] ||
      process.env["POSTGRES_PRISMA_URL"];

    if (!connectionString) {
      console.warn(
        "Warning: Neither DATABASE_URL, POSTGRES_URL, nor POSTGRES_PRISMA_URL is set in process.env",
      );
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
