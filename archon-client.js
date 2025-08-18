#!/usr/bin/env node

const http = require('http');

async function callArchon(method, params = {}, id = 1) {
  const data = JSON.stringify({
    jsonrpc: "2.0",
    id: id.toString(),
    method: method,
    params: params
  });

  const options = {
    hostname: 'localhost',
    port: 8051,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          // Handle SSE format
          if (responseData.includes('event: message')) {
            const lines = responseData.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonData = line.substring(6);
                try {
                  resolve(JSON.parse(jsonData));
                  return;
                } catch (e) {
                  // Continue looking for valid JSON
                }
              }
            }
          } else {
            resolve(JSON.parse(responseData));
          }
        } catch (error) {
          console.log('Raw response:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    // Try to get tools directly since the server logs show context is already connected
    console.log('🔄 Getting available tools from connected Archon process...');
    
    // Since the server creates its own session IDs, let's try different tool names
    const possibleMethods = [
      'get_current_task',
      'current_task', 
      'get_task',
      'task_status',
      'list_tasks',
      'get_next_task'
    ];
    
    console.log('🔄 Trying to call Archon tools directly...');
    
    for (const method of possibleMethods) {
      try {
        console.log(`\n🔄 Trying method: ${method}`);
        const result = await callArchon('tools/call', {
          name: method,
          arguments: {}
        }, Math.floor(Math.random() * 1000));
        
        if (result.error) {
          console.log(`❌ ${method}: ${result.error.message}`);
        } else {
          console.log(`✅ ${method} SUCCESS:`, JSON.stringify(result, null, 2));
          break; // Found a working method
        }
      } catch (error) {
        console.log(`❌ ${method}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[2]) {
  // Allow calling specific methods
  const method = process.argv[2];
  const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  
  callArchon(method, args).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
} else {
  main();
}
