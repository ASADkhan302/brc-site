import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const SOURCE_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="./" />
    <title>BRC Zhob — Integrated Website & College Management System</title>
    <meta name="description" content="Official public website, online admissions, alumni registration, and role-based College Management System (Admin, Teacher, Cadet, Parent portals) for Balochistan Residential College Zhob." />
    <meta property="og:title" content="BRC Zhob — Integrated Website & College Management System" />
    <meta property="og:description" content="Official public website, online admissions, alumni registration, and role-based College Management System (Admin, Teacher, Cadet, Parent portals) for Balochistan Residential College Zhob." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/jpeg" href="./assets/aistudio/BRC_Zhob_Official_Logo_369f56a6.jpg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-[#FFFDF8] text-[#23191A] antialiased selection:bg-[#720F19] selection:text-[#FFFDF8]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

function copyDirRecursiveSync(srcDir: string, destDir: string) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncPrebuiltBundleToRootPlugin(): Plugin {
  return {
    name: 'sync-prebuilt-bundle-to-root',
    closeBundle() {
      const rootDir = path.resolve(__dirname, '.');
      const distIndex = path.join(rootDir, 'dist', 'index.html');
      const distAssets = path.join(rootDir, 'dist', 'assets');

      if (fs.existsSync(distAssets)) {
        const rootAssets = path.join(rootDir, 'assets');
        const brcAssets = path.join(rootDir, 'brc-zhob', 'assets');
        // Clean old hashed index-*.js / index-*.css before copying new ones
        for (const targetAssetsDir of [rootAssets, brcAssets]) {
          if (fs.existsSync(targetAssetsDir)) {
            for (const f of fs.readdirSync(targetAssetsDir)) {
              if (f.startsWith('index-') && (f.endsWith('.js') || f.endsWith('.css'))) {
                try {
                  fs.unlinkSync(path.join(targetAssetsDir, f));
                } catch {}
              }
            }
          }
          copyDirRecursiveSync(distAssets, targetAssetsDir);
        }
      }

      if (fs.existsSync(distIndex)) {
        let html = fs.readFileSync(distIndex, 'utf-8');
        if (!html.includes('<base href="./"')) {
          html = html.replace('<head>', '<head>\n    <base href="./" />');
        }
        // Write compiled index.html (with ./assets/index-[hash].js) to root and brc-zhob/
        fs.writeFileSync(distIndex, html, 'utf-8');
        fs.writeFileSync(path.join(rootDir, 'index.html'), html, 'utf-8');
        const brcDir = path.join(rootDir, 'brc-zhob');
        if (fs.existsSync(brcDir)) {
          fs.writeFileSync(path.join(brcDir, 'index.html'), html, 'utf-8');
        }
      }
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === 'build') {
    // Ensure Vite reads the source entry point during `vite build`, then closeBundle() writes the compiled HTML back to root index.html
    fs.writeFileSync(path.resolve(__dirname, 'index.html'), SOURCE_INDEX_HTML, 'utf-8');
  }

  return {
    base: './', // Ensures relative asset paths (./assets/...) for subfolders
    plugins: [react(), tailwindcss(), syncPrebuiltBundleToRootPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

