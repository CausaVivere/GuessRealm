import type { MetadataRoute } from "next";

import { env } from "~/env";

const siteUrl = "https://www.guessrealm.fun";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
