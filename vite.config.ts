import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determine API URL based on environment
  const getApiUrl = () => {
    if (env.VITE_API_URL) {
      return env.VITE_API_URL;
    }
    
    // Default URLs based on mode
    if (mode === 'development') {
      return 'http://127.0.0.1:3001';
    } else if (mode === 'production') {
      return 'http://64.226.75.76:3001';
    }
    
    return 'http://127.0.0.1:3001';
  };
  
  const apiUrl = getApiUrl();
  
  return {
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
 
    tsconfigPaths(),
  ],
  define: {
    __VITE_API_URL__: JSON.stringify(apiUrl)
  },
  server: {
    host: '127.0.0.1', // Force IPv4
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // Force IPv4 target
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
  }
})
