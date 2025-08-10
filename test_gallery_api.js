// Test script to check if the gallery API is working with authentication
import fetch from 'node-fetch';

const API_BASE_URL = 'http://64.226.75.76:3001';

// Check if there's a token in localStorage (simulate browser environment)
const testToken = 'test-token'; // We'll need to get a real token

const testGalleryAPI = async () => {
  console.log('Testing Gallery API...');
  
  try {
    // Test without authentication first
    console.log('\n1. Testing without authentication:');
    const response1 = await fetch(`${API_BASE_URL}/api/images/jobs?limit=10`);
    console.log('Status:', response1.status);
    console.log('Response:', await response1.text());
    
    // Test with a dummy token
    console.log('\n2. Testing with dummy token:');
    const response2 = await fetch(`${API_BASE_URL}/api/images/jobs?limit=10`, {
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    console.log('Status:', response2.status);
    console.log('Response:', await response2.text());
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testGalleryAPI();