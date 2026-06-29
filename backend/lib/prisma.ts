import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForDB = global as unknown as { db: PrismaClient };

const connectionString = process.env.DATABASE_URL;
if (process.env.NODE_ENV === "production" && !connectionString) {
  throw new Error("Missing required env: DATABASE_URL");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const basePrisma =
  globalForDB.db ||
  new PrismaClient({
    adapter: adapter,
  });

if (process.env.NODE_ENV !== "production") globalForDB.db = basePrisma;

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const softDeleteModels = ["Product", "Category", "Coupon", "BankOffer"];
        if (softDeleteModels.includes(model)) {
          if ([
            "findMany", "findFirst", "findFirstOrThrow",
            "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"
          ].includes(operation)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const a = args as any;
            a.where = a.where || {};
            if (a.where.isDeleted === undefined) {
              a.where.isDeleted = false;
            }
          }
        }
        return query(args);
      },
    },
  },
});