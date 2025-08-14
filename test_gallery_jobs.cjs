const axios = require('axios');

const API_BASE_URL = 'http://64.226.75.76/api';
const jobId = '910c555d-ead2-4aab-81ec-70b1d4d8db00';
const userCredentials = {
  email: 'darkhesaplar@gmail.com',
  password: 'onrcm123@'
};

async function loginAndTestGallery() {
  try {
    console.log('Step 1: Logging in with user credentials...');
    
    // Login to get authentication token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, userCredentials);
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }
    
    // Handle different response formats
    let token, user;
    if (loginResponse.data.data) {
      // Format: { success: true, data: { token, user } }
      token = loginResponse.data.data.token;
      user = loginResponse.data.data.user;
    } else {
      // Format: { token, user }
      token = loginResponse.data.token;
      user = loginResponse.data.user;
    }
    
    console.log('Login successful! User ID:', user?.id || 'N/A');
    console.log('User email:', user?.email || 'N/A');
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Set up axios with authentication header
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\nStep 2: Testing gallery jobs endpoint with authentication...');
    
    // Test 1: Get all jobs for authenticated user
    console.log('\n1. Testing GET /api/images/jobs');
    const jobsResponse = await axios.get(`${API_BASE_URL}/images/jobs`, { headers: authHeaders });
    console.log('Status:', jobsResponse.status);
    console.log('Jobs count:', jobsResponse.data.length);
    
    if (jobsResponse.data.length > 0) {
      console.log('First job details:', JSON.stringify(jobsResponse.data[0], null, 2));
      
      // Check if our specific job is in the list
      const ourJob = jobsResponse.data.find(job => job.id === jobId);
      if (ourJob) {
        console.log('\nFound our test job in the list!');
        console.log('Job status:', ourJob.status);
        console.log('Processed images count:', ourJob.processed_images?.length || 0);
        if (ourJob.processed_images && ourJob.processed_images.length > 0) {
          console.log('First processed image:', JSON.stringify(ourJob.processed_images[0], null, 2));
        }
      } else {
        console.log('\nOur test job NOT found in the list. This might be the issue!');
        console.log('Available job IDs:', jobsResponse.data.map(job => job.id));
      }
    } else {
      console.log('No jobs found for this user!');
    }
    
    // Test 2: Get specific job
    console.log('\n2. Testing GET /api/images/jobs/:jobId');
    try {
      const specificJobResponse = await axios.get(`${API_BASE_URL}/images/jobs/${jobId}`, { headers: authHeaders });
      console.log('Status:', specificJobResponse.status);
      console.log('Job details:', JSON.stringify(specificJobResponse.data, null, 2));
    } catch (error) {
      console.log('Error getting specific job:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 3: Get job status
    console.log('\n3. Testing GET /api/images/jobs/:jobId/status');
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/images/jobs/${jobId}/status`, { headers: authHeaders });
      console.log('Status:', statusResponse.status);
      console.log('Job status:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log('Error getting job status:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('Error in login and test process:', error.response?.status, error.response?.data || error.message);
  }
}

loginAndTestGallery();