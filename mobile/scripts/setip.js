#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/setip.js          → auto-detect LAN IP and patch api.js
 *   node scripts/setip.js 192.168.1.42  → use a specific IP
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const API_FILE = path.join(__dirname, '..', 'src', 'utils', 'api.js');
const PORT = 5000;

function getLanIP() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const iface of nets[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer common LAN ranges
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          candidates.push({ name, address: iface.address });
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prefer Wi-Fi/WLAN interfaces
  const wifi = candidates.find((c) => /wi.?fi|wlan|wireless/i.test(c.name));
  return wifi ? wifi.address : candidates[0].address;
}

function patchApiFile(ip) {
  let content = fs.readFileSync(API_FILE, 'utf8');

  // Replace the production URL placeholder or any existing hardcoded IP
  const newUrl = `http://${ip}:${PORT}/api`;

  // Patch the production fallback line so it also uses the local IP when needed
  content = content.replace(
    /return 'https?:\/\/[^']+\/api';(\s*\/\/ Production.*)?/,
    `return '${newUrl}'; // Patched by setip.js — run again to update`
  );

  fs.writeFileSync(API_FILE, content, 'utf8');
  return newUrl;
}

function printInterfaces() {
  const nets = os.networkInterfaces();
  console.log('\nAvailable network interfaces:');
  for (const [name, ifaces] of Object.entries(nets)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4') {
        console.log(`  ${name.padEnd(20)} ${iface.address}${iface.internal ? '  (loopback)' : ''}`);
      }
    }
  }
}

const arg = process.argv[2];
let ip;

if (arg) {
  // Manual IP provided
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(arg)) {
    console.error('Invalid IP address:', arg);
    process.exit(1);
  }
  ip = arg;
  console.log(`Using provided IP: ${ip}`);
} else {
  ip = getLanIP();
  if (!ip) {
    printInterfaces();
    console.error('\nCould not auto-detect LAN IP. Pass it manually: node scripts/setip.js <IP>');
    process.exit(1);
  }
  console.log(`Auto-detected LAN IP: ${ip}`);
}

const url = patchApiFile(ip);
console.log(`\n✅  api.js patched → BASE_URL = ${url}`);
console.log(`\nMake sure the backend is running:\n   cd backend && npm run dev\n`);
printInterfaces();
