const fs = require('fs');
const http = require('http');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const API_BASE_URL = process.env.API_BASE_URL || `http://${HOST}:${PORT}`;

// Simple multipart form data builder
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

async function testCSVImport() {
  try {
    console.log('Testing Enhanced CSV Import...');
    
    const formData = buildFormData('test-cpi-import.csv');
    
    const options = {
      hostname: HOST,
      port: parseInt(PORT),
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
        try {
          const result = JSON.parse(data);
          
          console.log('\n=== CSV Import Test Results ===');
          console.log('Response Status:', res.statusCode);
          
          if (result.success) {
            console.log('✅ CSV Import Test PASSED');
            console.log(`📊 Results:`);
            console.log(`   - Created: ${result.result.created} products`);
            console.log(`   - Updated: ${result.result.updated} products`);
            console.log(`   - Errors: ${result.result.errors.length}`);
            console.log(`   - Processed: ${result.result.processed} rows`);
            
            if (result.result.skippedEmptyRows > 0) {
              console.log(`   - Skipped empty rows: ${result.result.skippedEmptyRows}`);
            }
            
            console.log('\n🎉 Enhanced CPI CSV import is working!');
            console.log('💡 Now try your full CPI file through the web interface.');
            
          } else {
            console.log('❌ CSV Import Test FAILED');
            console.log('Error:', result.error || result.message);
            
            if (result.result && result.result.errors.length > 0) {
              console.log('\nDetailed errors:');
              result.result.errors.slice(0, 3).forEach((error, index) => {
                console.log(`  ${index + 1}. Row ${error.row}: ${error.error}`);
              });
            }
          }
          
        } catch (parseError) {
          console.log('❌ Failed to parse response:', parseError.message);
          console.log('Raw response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      console.log(`\n💡 Make sure the server is running on ${API_BASE_URL}`);
      console.log('   Run: npm run dev');
    });

    req.write(formData.body);
    req.end();
    
  } catch (error) {
    console.error('❌ Test Setup Error:', error.message);
  }
}

console.log('🧪 Starting Enhanced CSV Import Test...');
console.log('📂 Testing with: test-cpi-import.csv');
console.log(`🌐 Target: ${API_BASE_URL}/api/products/bulk-import\n`);

testCSVImport();