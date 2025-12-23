import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Plugin para atualizar version.json com timestamp do build
function updateVersionPlugin(): Plugin {
  return {
    name: 'update-version',
    buildStart() {
      const versionPath = path.resolve(__dirname, 'public/version.json');
      const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
      
      const versionInfo = {
        version: packageJson.version || '1.0.0',
        timestamp: new Date().toISOString(),
        buildId: Date.now().toString(36)
      };
      
      fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
      console.log(`📦 Version updated: v${versionInfo.version} | Build: ${versionInfo.buildId}`);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && updateVersionPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Cache busting com hash nos nomes dos arquivos
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
}));
