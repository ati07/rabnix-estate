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

  // Sample owner + live listings so search/detail are testable end-to-end.
  const owner = await prisma.user.upsert({
    where: { phone: "+919999900000" },
    update: {},
    create: { phone: "+919999900000", phoneVerified: true, role: "owner", fullName: "Sample Owner" },
  });

  const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const samples = [
    { id: "seed-listing-1", intent: "rent" as const, propertyType: "apartment" as const, price: 25000, bedrooms: 2, areaSqft: 950, localityId: "seed-wakad", lat: 18.598, lng: 73.7629, title: "2 BHK in Wakad, semi-furnished" },
    { id: "seed-listing-2", intent: "sale" as const, propertyType: "apartment" as const, price: 8500000, bedrooms: 3, areaSqft: 1350, localityId: "seed-baner", lat: 18.559, lng: 73.7868, title: "3 BHK in Baner with parking" },
    { id: "seed-listing-3", intent: "rent" as const, propertyType: "apartment" as const, price: 32000, bedrooms: 3, areaSqft: 1200, localityId: "seed-hinjewadi", lat: 18.5913, lng: 73.7389, title: "3 BHK near Hinjewadi IT park" },
    { id: "seed-listing-4", intent: "sale" as const, propertyType: "villa" as const, price: 14500000, bedrooms: 4, areaSqft: 2400, localityId: "seed-kharadi", lat: 18.5515, lng: 73.943, title: "4 BHK villa in Kharadi" },
  ];

  for (const s of samples) {
    await prisma.listing.upsert({
      where: { id: s.id },
      update: {},
      create: {
        ...s,
        ownerId: owner.id,
        status: "live",
        furnishing: "semi_furnished",
        qualityScore: 5,
        expiresAt,
        media: { create: [{ url: `https://picsum.photos/seed/${s.id}/800/600`, isPrimary: true, ord: 0 }] },
      },
    });
  }

  console.log(
    `Seeded city ${city.name} with ${localities.length} localities and ${samples.length} live listings.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
