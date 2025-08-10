const axios = require('axios');

// Test webhook callback to simulate n8n response
async function testWebhookCallback() {
  const webhookUrl = 'http://64.226.75.76:3001/api/images/webhook/job-complete';
  
  const testPayload = {
    jobId: '910c555d-ead2-4aab-81ec-70b1d4d8db00',
    status: 'completed',
    processedImages: [
      'https://example.com/processed-image-1.jpg',
      'https://example.com/processed-image-2.jpg'
    ]
  };

  try {
    console.log('🚀 Sending test webhook callback...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(webhookUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook response:', {
      status: response.status,
      data: response.data
    });
    
  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Test with failed status as well
async function testFailedWebhook() {
  const webhookUrl = 'http://64.226.75.76:3001/api/images/webhook/job-complete';
  
  const testPayload = {
    jobId: '910c555d-ead2-4aab-81ec-70b1d4d8db00',
    status: 'failed',
    error: 'Test error message'
  };

  try {
    console.log('\n🚀 Sending test failed webhook callback...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(webhookUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Failed webhook response:', {
      status: response.status,
      data: response.data
    });
    
  } catch (error) {
    console.error('❌ Failed webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run tests
async function runTests() {
  await testWebhookCallback();
  await testFailedWebhook();
}

runTests();