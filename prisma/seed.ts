import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seeds the launch city + a few dense localities (Pune default — see .env.example).
// Supply seeding of real listings is an ops task (see docs/build-plan-phase1.md, Weeks 5–6).
async function main() {
  const city = await prisma.city.upsert({
    where: { id: "seed-pune" },
    update: {},
    create: { id: "seed-pune", name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  });

  const localities = [
    { name: "Wakad", lat: 18.5980, lng: 73.7629, aliases: ["Wakhad"] },
    { name: "Baner", lat: 18.5590, lng: 73.7868, aliases: ["Baaner", "Banner"] },
    { name: "Hinjewadi", lat: 18.5913, lng: 73.7389, aliases: ["Hinjawadi"] },
    { name: "Kharadi", lat: 18.5515, lng: 73.9430, aliases: [] },
  ];

  for (const loc of localities) {
    await prisma.locality.upsert({
      where: { id: `seed-${loc.name.toLowerCase()}` },
      update: {},
      create: { id: `seed-${loc.name.toLowerCase()}`, cityId: city.id, ...loc },
    });
  }

  console.log(`Seeded city ${city.name} with ${localities.length} localities.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
