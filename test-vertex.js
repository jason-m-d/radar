import 'dotenv/config';  // Add this line at the very top
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function test() {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Say hello from Anthropic API'
      }]
    });
    
    console.log('✅ Claude Sonnet 4.5 is working!');
    console.log('Response:', message.content[0].text);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();