import type { MetadataRoute } from "next";

import { env } from "~/env";

const siteUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

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
