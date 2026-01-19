import "dotenv/config";

import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { AppSettings } from "./models/AppSettings.js";
import { PortalCredential } from "./models/PortalCredential.js";

async function ensureSeedData() {
  const existingSettings = await AppSettings.findOne({}).lean().exec();
  if (!existingSettings) {
    await AppSettings.create({
      name: "DonateFlow",
      address: "",
      phone: "",
      logoPath: "",
    });
  }

  const defaults = [
    { portalKey: "admin", username: "admin", password: "admin" },
  ] as const;

  for (const item of defaults) {
    const exists = await PortalCredential.findOne({ portalKey: item.portalKey, username: item.username }).lean().exec();
    if (exists) continue;
    const passwordHash = await PortalCredential.hashPassword(item.password);
    await PortalCredential.create({
      portalKey: item.portalKey,
      username: item.username,
      passwordHash,
      isActive: true,
    });
  }
}

async function main() {
  try {
    await connectDb();
    await ensureSeedData();
  } catch (error) {
    console.warn("Database connection failed, running without DB:", (error as Error).message);
  }
  
  const app = createApp();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
