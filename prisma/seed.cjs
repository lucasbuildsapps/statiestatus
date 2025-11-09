// prisma/seed.cjs
require("dotenv/config"); // load .env so Prisma gets DATABASE_URL
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const locations = [
    { name: "AH Gelderlandplein", retailer: "Albert Heijn", lat: 52.3337, lng: 4.8878, address: "Gelderlandplein 1", city: "Amsterdam" },
    { name: "Jumbo Damrak", retailer: "Jumbo", lat: 52.3740, lng: 4.8966, address: "Damrak 35", city: "Amsterdam" },
    { name: "Lidl De Pijp", retailer: "Lidl", lat: 52.3511, lng: 4.8965, address: "Ferd. Bolstraat 100", city: "Amsterdam" },
  ];

  // First-time seed: insert all rows
  await prisma.location.createMany({ data: locations });

  console.log("✅ Seeded locations:", locations.length);
}


main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
