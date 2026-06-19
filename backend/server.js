import { app } from "./src/app.js";
import { env } from "./src/config/env.js";
import { prisma } from "./src/config/prisma.js";

const server = app.listen(env.PORT, () => {
  console.info(`SaudiaCareers API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.info(`${signal} received. Shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

