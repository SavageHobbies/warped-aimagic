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

const formData = buildFormData('debug-csv-test.csv');

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
    console.log('Response:', data);
  });
});

req.write(formData.body);
req.end();