import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// A small set of starter presets for the image studio. The full curated
// preset library is expanded in Phase 4.
const presets = [
  {
    slug: "cinematic-portrait",
    title: "Cinematic Portrait",
    description: "Moody, film-lit close-up with shallow depth of field.",
    category: "portrait",
    promptTemplate:
      "cinematic portrait of {{subject}}, dramatic rim lighting, 85mm lens, shallow depth of field, film grain, high detail",
    negativePrompt: "blurry, lowres, distorted, extra limbs",
    modifiers: { aspectRatio: "3:4", guidance: 3.5 },
    featured: true,
  },
  {
    slug: "product-hero",
    title: "Product Hero Shot",
    description: "Clean studio product photography on a seamless backdrop.",
    category: "product",
    promptTemplate:
      "professional product photo of {{subject}}, studio lighting, seamless gradient backdrop, soft reflections, ultra sharp, commercial photography",
    negativePrompt: "cluttered background, text, watermark",
    modifiers: { aspectRatio: "1:1", guidance: 4 },
    featured: true,
  },
  {
    slug: "neon-anime",
    title: "Neon Anime",
    description: "Vibrant anime style with neon city lighting.",
    category: "anime",
    promptTemplate:
      "anime illustration of {{subject}}, neon city at night, vibrant colors, cel shaded, detailed background, studio quality",
    negativePrompt: "realistic, photo, blurry",
    modifiers: { aspectRatio: "16:9", guidance: 5 },
    featured: false,
  },
];

async function main() {
  for (const p of presets) {
    await prisma.preset.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`Seeded ${presets.length} presets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
