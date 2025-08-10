import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function setupTunnel() {
  try {
    console.log('🚀 Starting localtunnel for backend...');
    
    // Start localtunnel on port 3000
    const lt = spawn('lt', ['--port', '3000'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let url = '';
    
    lt.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📡 Tunnel output:', output);
      
      // Extract URL from localtunnel output
      const urlMatch = output.match(/https:\/\/[\w-]+\.loca\.lt/);
      if (urlMatch && !url) {
        url = urlMatch[0];
        console.log('✅ Tunnel started successfully!');
        console.log('📡 Public URL:', url);
        
        // Create callback URL
        const callbackUrl = `${url}/api/images/callback`;
        console.log('🔗 Callback URL:', callbackUrl);
        
        // Save URLs to a JSON file for the frontend to read
        const urlData = {
          publicUrl: url,
          callbackUrl: callbackUrl,
          timestamp: new Date().toISOString()
        };
        
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(publicDir, 'ngrok-url.json'),
          JSON.stringify(urlData, null, 2)
        );
        
        console.log('💾 URL data saved to public/ngrok-url.json');
        console.log('\n📋 Instructions:');
        console.log('1. Use this callback URL in your n8n HTTP Request node:');
        console.log(`   ${callbackUrl}`);
        console.log('2. Keep this terminal open to maintain the tunnel');
        console.log('3. The tunnel will remain active until you stop this process');
      }
    });
    
    lt.stderr.on('data', (data) => {
      console.error('❌ Tunnel error:', data.toString());
    });
    
    lt.on('close', (code) => {
      console.log(`🛑 Tunnel process exited with code ${code}`);
    });
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping tunnel...');
      lt.kill();
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
      if (url) {
        console.log('🔄 Tunnel is active:', new Date().toLocaleTimeString());
      }
    }, 60000); // Log every minute
    
  } catch (error) {
    console.error('❌ Error setting up tunnel:', error);
    process.exit(1);
  }
}

setupTunnel();