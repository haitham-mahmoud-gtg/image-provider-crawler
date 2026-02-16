const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Read APIs from file
const apisFile = 'apis.txt';
const apis = fs.readFileSync(apisFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Checking ${apis.length} APIs...\n`);

// Function to check a single API
function checkApi(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.get(url, { timeout: 10000 }, (res) => {
        // Consume response data to free up memory
        res.resume();
        
        resolve({
          url,
          status: res.statusCode,
          success: res.statusCode === 200
        });
      });

      req.on('error', (error) => {
        resolve({
          url,
          status: 'ERROR',
          success: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          status: 'TIMEOUT',
          success: false,
          error: 'Request timeout'
        });
      });
    } catch (error) {
      resolve({
        url,
        status: 'INVALID',
        success: false,
        error: error.message
      });
    }
  });
}

// Check all APIs
async function checkAllApis() {
  const results = [];
  
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    console.log(`[${i + 1}/${apis.length}] Checking: ${api}`);
    
    const result = await checkApi(api);
    results.push(result);
    
    if (result.success) {
      console.log(`✓ Status: ${result.status} - OK\n`);
    } else {
      console.log(`✗ Status: ${result.status} - ${result.error || 'Failed'}\n`);
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\nTotal APIs: ${results.length}`);
  console.log(`✓ Successful (200): ${successful.length}`);
  console.log(`✗ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed APIs:');
    failed.forEach((result) => {
      console.log(`  - ${result.url}`);
      console.log(`    Status: ${result.status}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
  }

  // Save successful APIs to text file (only URLs with 200 status)
  const successfulApisFile = 'successful-apis.txt';
  const successfulUrls = successful.map(r => r.url).join('\n');
  fs.writeFileSync(successfulApisFile, successfulUrls);
  console.log(`\nSuccessful APIs (200 only) saved to: ${successfulApisFile}`);
}

// Run the checker
checkAllApis().catch(console.error);
