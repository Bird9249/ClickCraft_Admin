import { serve } from "bun";
import { join } from "node:path";
import indexHtml from "./src/index.html";
import app from "./src/server/index.js";

const faviconDir = join(import.meta.dir, "src/assets/favicon_io");
const faviconFiles = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
] as const;

const faviconRoutes = Object.fromEntries(
  faviconFiles.map((file) => [`/${file}`, Bun.file(join(faviconDir, file))]),
);

const server = serve({
  routes: {
    ...faviconRoutes,
    "/api/*": app.fetch,

    // Serve static files from dist/ before other routes
    "/*": indexHtml,
  },

  development: {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
