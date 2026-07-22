import { serve } from "bun";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import compliedApp from "./out/server/main";

const DIST_DIR = join(process.cwd(), "out", "dist");

// Helper function to find file with hash pattern in production
function findHashedFile(baseName: string, extension: string) {
  try {
    const files = readdirSync(DIST_DIR);
    const matchingFile = files.find(
      (file) =>
        file.startsWith(`${baseName}-`) && file.endsWith(`.${extension}`),
    );

    if (matchingFile) {
      return Bun.file(join(DIST_DIR, matchingFile));
    }
  } catch (error) {
    console.error(
      `Could not find hashed file for ${baseName}.${extension}:`,
      error,
    );
  }

  // Fallback to original name if no hashed file found
  return Bun.file(join(DIST_DIR, `${baseName}.${extension}`));
}

// Helper function to serve static files from out/dist/
function serveStaticFile(url: string) {
  const distDir = DIST_DIR;

  // Remove leading slash
  const filePath = url.startsWith("/") ? url.slice(1) : url;

  try {
    const fullPath = join(distDir, filePath);

    // Check if file exists
    if (statSync(fullPath).isFile()) {
      return new Response(Bun.file(fullPath));
    }
  } catch {
    // File not found
  }

  return null;
}

const serviceWorkerFile = findHashedFile("service-worker", "js");
const manifestFile = findHashedFile("manifest", "webmanifest");
const indexFile = findHashedFile("index", "html");

const server = serve({
  routes: {
    "/service-worker.js": new Response(serviceWorkerFile, {
      headers: {
        "Content-Type": "application/javascript",
      },
    }),

    "/manifest.webmanifest": new Response(manifestFile, {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    }),

    "/api/*": compliedApp.fetch,

    // Serve static files from dist/ before other routes
    "/*": (req) => {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // Try to serve static file first
      const staticResponse = serveStaticFile(pathname);
      if (staticResponse) {
        return staticResponse;
      }

      // If not a static file, serve index.html for SPA routing
      return new Response(indexFile, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    },
  },
});

console.log(`🚀 Server running at ${server.url}`);
