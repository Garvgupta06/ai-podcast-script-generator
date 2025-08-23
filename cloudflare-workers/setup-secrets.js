#!/usr/bin/env node

/**
 * Setup script for configuring Cloudflare Workers secrets
 * Run this script to interactively set up your API keys
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupSecrets() {
  console.log('🚀 Setting up Cloudflare Workers secrets for AI Podcast Script Generator\n');
  
  try {
    // Check if wrangler is available
    execSync('wrangler --version', { stdio: 'pipe' });
    console.log('✅ Wrangler CLI is available\n');
  } catch (error) {
    console.error('❌ Wrangler CLI not found. Please install it first:');
    console.error('npm install -g wrangler');
    console.error('Then run: wrangler login\n');
    process.exit(1);
  }
  
  const environment = await question('Which environment? (development/production) [production]: ') || 'production';
  
  console.log(`\n📝 Setting up secrets for ${environment} environment...\n`);
  
  // OpenAI API Key
  const openaiKey = await question('Enter your OpenAI API Key (starts with sk-...): ');
  if (openaiKey.trim()) {
    try {
      execSync(`wrangler secret put OPENAI_API_KEY --env ${environment}`, { 
        input: openaiKey.trim(),
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log('✅ OpenAI API Key set successfully');
    } catch (error) {
      console.error('❌ Failed to set OpenAI API Key');
    }
  }
  
  // Anthropic API Key
  const anthropicKey = await question('Enter your Anthropic API Key (optional, press Enter to skip): ');
  if (anthropicKey.trim()) {
    try {
      execSync(`wrangler secret put ANTHROPIC_API_KEY --env ${environment}`, {
        input: anthropicKey.trim(),
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log('✅ Anthropic API Key set successfully');
    } catch (error) {
      console.error('❌ Failed to set Anthropic API Key');
    }
  }
  
  // Valid API Keys for authentication
  const validApiKeys = await question('Enter comma-separated API keys for client authentication (optional): ');
  if (validApiKeys.trim()) {
    try {
      execSync(`wrangler secret put VALID_API_KEYS --env ${environment}`, {
        input: validApiKeys.trim(),
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log('✅ Valid API Keys set successfully');
    } catch (error) {
      console.error('❌ Failed to set Valid API Keys');
    }
  }
  
  console.log('\n🎉 Secret setup complete!');
  console.log('\nNext steps:');
  console.log(`1. Deploy your worker: npm run deploy`);
  console.log(`2. Test your API: curl https://your-worker.your-subdomain.workers.dev/api/health`);
  
  rl.close();
}

if (require.main === module) {
  setupSecrets().catch(console.error);
}

module.exports = { setupSecrets };
