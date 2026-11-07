import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'layout-saver',
      configureServer(server) {
        server.middlewares.use('/api/save-layout', (req, res) => {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            if (body && body.length > 10) {
              fs.writeFileSync('saved-layout.json', body);
            }
            res.end('saved');
          });
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/*.xlsx', '**/*.csv', '**/*.log', '**/scratch/**', '**/*.pdf']
    }
  }
});

