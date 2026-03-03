import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LOS - Life Operating System",
    short_name: "LOS",
    description: "Life Operating System command center for focus, finance, learning, health, and planning.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#07151f",
    theme_color: "#0ea5a8",
    orientation: "portrait",
    scope: "/",
    lang: "en-AU",
    categories: ["productivity", "finance", "lifestyle"],
    shortcuts: [
      {
        name: "Focus Mode",
        short_name: "Focus",
        description: "Open today's focused execution view.",
        url: "/focus",
      },
      {
        name: "Projects",
        short_name: "Projects",
        description: "Open projects and task workflow board.",
        url: "/projects",
      },
      {
        name: "Journal",
        short_name: "Journal",
        description: "Capture a new journal reflection.",
        url: "/journal",
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
