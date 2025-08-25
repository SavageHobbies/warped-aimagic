const fs = require('fs');
const http = require('http');
const path = require('path');

function buildFormData(filePath) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
  body += `Content-Type: text/csv\r\n\r\n`;
  body += fileBuffer.toString();
  body += `\r\n--${boundary}--\r\n`;
  
  return {
    body: Buffer.from(body),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

console.log('🧪 Testing Enhanced CPI Import with Real File...');
console.log('📂 File: test-real-cpi.csv');
console.log('🎯 Expected: Intelligent column detection should correctly map all fields\n');

const formData = buildFormData('test-real-cpi.csv');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products/bulk-import',
  method: 'POST',
  headers: {
    'Content-Type': formData.contentType,
    'Content-Length': formData.body.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('📊 Import Results:');
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ SUCCESS!');
        console.log(`   Created: ${result.result.created} products`);
        console.log(`   Updated: ${result.result.updated} products`);
        console.log(`   Errors: ${result.result.errors.length}`);
        console.log(`   Processed: ${result.result.processed} rows`);
      } else {
        console.log('❌ FAILED:', result.error || result.message);
      }
    } catch (e) {
      console.log('❌ Parse Error:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(formData.body);
req.end();