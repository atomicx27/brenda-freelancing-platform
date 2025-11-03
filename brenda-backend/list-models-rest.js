/**
 * List Gemini models using REST (v1 and v1beta) to diagnose key access
 */

const https = require('https');
require('dotenv').config();

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      })
      .on('error', reject);
  });
}

async function run() {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  console.log('\n🔎 REST Model Listing');
  console.log('='.repeat(60));
  console.log('Key present:', Boolean(key));
  console.log('Key prefix:', key.slice(0, 6));

  const urls = [
    `https://generativelanguage.googleapis.com/v1/models?key=${key}`,
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
  ];

  for (const url of urls) {
    console.log(`\nGET ${url}`);
    try {
      const { status, body } = await get(url);
      console.log('Status:', status);
      console.log('Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    } catch (err) {
      console.log('Request error:', err.message);
    }
  }
}

run();
