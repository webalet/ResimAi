// Test script to simulate the n8n callback that was successful
import fetch from 'node-fetch';

const testData = {
  "images": [{
    "url": "https://fal.media/files/penguin/pxV5PVyw8nKxbN0wUtoiN_e987f7943c474a7da24c94dd04e38833.jpg",
    "width": 880,
    "height": 1184
  }],
  "prompt": "Enhance and improve the person in the image with professional quality."
};

const jobId = '910c555d-ead2-4aab-81ec-70b1d4d8db00';
const url = `http://64.226.75.76:3001/api/images/n8n-result?jobId=${jobId}`;

console.log('Testing n8n callback with data:', testData);
console.log('URL:', url);

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([testData])
})
.then(response => response.json())
.then(data => {
  console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('Error:', error);
});