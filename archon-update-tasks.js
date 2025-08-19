#!/usr/bin/env node

const http = require('http');
const crypto = require('crypto');

// Generate a unique session ID
const sessionId = crypto.randomBytes(16).toString('hex');

async function callArchon(method, params = {}) {
  const requestId = crypto.randomBytes(8).toString('hex');
  
  const data = JSON.stringify({
    jsonrpc: "2.0",
    id: requestId,
    method: method,
    params: params,
    meta: {
      sessionId: sessionId
    }
  });

  const options = {
    hostname: 'localhost',
    port: 8051,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'X-Session-ID': sessionId,
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
                  const parsed = JSON.parse(jsonData);
                  resolve(parsed);
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

async function updateTasks() {
  console.log('🚀 Starting Archon task update process...');
  console.log('📝 Session ID:', sessionId);
  
  // Tasks to mark as complete
  const completedTasks = [
    {
      title: "eBay API integration - OAuth and Set APIs",
      status: "Complete",
      notes: "OAuth flow and API integration completed successfully"
    },
    {
      title: "Redesign product pages for comprehensive eBay listing support",
      status: "Complete", 
      notes: "Product model and pages support all eBay fields"
    },
    {
      title: "Fix dark mode CSS variables and theme infrastructure",
      status: "Complete",
      notes: "Dark mode is working throughout the app"
    },
    {
      title: "Extend Prisma schema for listing workflow",
      status: "Complete",
      notes: "Schema has been extended with all necessary fields"
    },
    {
      title: "CPI Integration: Implement parsing and normalization utilities",
      status: "Complete",
      notes: "CSV parsing and data normalization utilities implemented"
    },
    {
      title: "CPI Integration: Build Import Service (upsert-by-UPC)",
      status: "Complete",
      notes: "Import service with upsert functionality completed"
    },
    {
      title: "CPI Integration: Create /api/cpi/import endpoint",
      status: "Complete",
      notes: "API endpoint for CPI import created and tested"
    },
    {
      title: "CPI Integration: Build Export Service (Prisma → CSV)",
      status: "Complete",
      notes: "Export service for converting Prisma data to CSV completed"
    },
    {
      title: "CPI Integration: Create /api/cpi/export endpoint",
      status: "Complete",
      notes: "API endpoint for CPI export created and tested"
    },
    {
      title: "CPI Integration: Lock down CSV specification and canonical header",
      status: "Complete",
      notes: "CSV format standardized and documented"
    },
    {
      title: "CPI Integration: Define data mapping contract (CSV ↔ Prisma)",
      status: "Complete",
      notes: "Data mapping between CSV and Prisma models implemented"
    },
    {
      title: "CPI Integration: UI - Inventory page Import modal",
      status: "Complete",
      notes: "Import modal UI implemented on inventory page"
    },
    {
      title: "CPI Integration: UI - Inventory page Export modal",
      status: "Complete",
      notes: "Export modal UI implemented on inventory page"
    },
    {
      title: "CPI Integration: UI - Product detail CPI export",
      status: "Complete",
      notes: "Product detail CPI export functionality completed"
    },
    {
      title: "AI Magic testing",
      status: "Complete",
      notes: "AI product identification via OpenAI is working"
    }
  ];

  try {
    // First try to initialize session
    console.log('\n🔄 Initializing session with Archon...');
    const initResult = await callArchon('initialize', {
      clientInfo: {
        name: "archon-task-updater",
        version: "1.0.0"
      },
      capabilities: {}
    });
    
    if (initResult.result) {
      console.log('✅ Session initialized successfully');
    }

    // Try to list available tools
    console.log('\n🔄 Getting available tools...');
    const toolsResult = await callArchon('tools/list', {});
    
    if (toolsResult.result && toolsResult.result.tools) {
      console.log('✅ Available tools:', toolsResult.result.tools.map(t => t.name).join(', '));
      
      // Look for task update tool
      const taskTool = toolsResult.result.tools.find(t => 
        t.name.includes('task') || 
        t.name.includes('update') || 
        t.name.includes('status')
      );
      
      if (taskTool) {
        console.log(`\n🔄 Found task tool: ${taskTool.name}`);
        
        // Update each task
        for (const task of completedTasks) {
          console.log(`\n📝 Updating: ${task.title}`);
          try {
            const result = await callArchon('tools/call', {
              name: taskTool.name,
              arguments: task
            });
            
            if (result.result) {
              console.log(`   ✅ Updated successfully`);
            } else if (result.error) {
              console.log(`   ⚠️ Error: ${result.error.message}`);
            }
          } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative approach - direct tool calls
    console.log('\n🔄 Trying direct tool calls...');
    
    const possibleMethods = [
      'update_task_status',
      'update-task-status',
      'updateTaskStatus',
      'task_update',
      'task-update',
      'update_task',
      'update-task'
    ];
    
    for (const method of possibleMethods) {
      try {
        console.log(`\n🔄 Trying method: ${method}`);
        const result = await callArchon('tools/call', {
          name: method,
          arguments: {
            tasks: completedTasks
          }
        });
        
        if (!result.error) {
          console.log(`✅ Success with ${method}!`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }
  }
}

// Run the update
updateTasks().then(() => {
  console.log('\n✨ Task update process completed');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
