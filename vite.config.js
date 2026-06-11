import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number.parseInt(env.FRONTEND_PORT || env.PORT || '5173', 10);
  const frontendHost = env.FRONTEND_HOST || '0.0.0.0';

  return {
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: false,
      allowedHosts: true,
    },
    preview: {
      host: frontendHost,
      port: frontendPort,
      strictPort: false,
    },
  };
})
