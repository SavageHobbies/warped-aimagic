# Simple PowerShell script to update Archon task statuses

function Call-Archon {
    param(
        [string]$Method,
        [hashtable]$Params = @{},
        [string]$SessionId = [System.Guid]::NewGuid().ToString()
    )
    
    $body = @{
        jsonrpc = "2.0"
        id = [System.Guid]::NewGuid().ToString()
        method = $Method
        params = $Params
    } | ConvertTo-Json -Depth 10 -Compress
    
    $headers = @{
        "Accept" = "application/json, text/event-stream"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8051/mcp" -Method POST -Body $body -Headers $headers -ErrorAction Stop
        return $response
    } catch {
        Write-Host "Error calling Archon: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Yellow
        }
        return $null
    }
}

Write-Host "Connecting to Archon server..." -ForegroundColor Cyan

# Initialize session
$initParams = @{
    protocolVersion = "1.0.0"
    capabilities = @{
        tools = @{}
    }
    clientInfo = @{
        name = "warp-agent"
        version = "1.0.0"
    }
}

$sessionId = [System.Guid]::NewGuid().ToString()
Write-Host "Session ID: $sessionId" -ForegroundColor Green

$initResult = Call-Archon -Method "initialize" -Params $initParams -SessionId $sessionId

if ($initResult) {
    Write-Host "Connected to Archon" -ForegroundColor Green
    
    # List available tools
    Write-Host "`nGetting available tools..." -ForegroundColor Cyan
    $toolsResult = Call-Archon -Method "tools/list" -Params @{} -SessionId $sessionId
    
    if ($toolsResult -and $toolsResult.result -and $toolsResult.result.tools) {
        $tools = $toolsResult.result.tools
        Write-Host "Found $($tools.Count) tools:" -ForegroundColor Green
        foreach ($tool in $tools) {
            Write-Host "  - $($tool.name): $($tool.description)" -ForegroundColor Gray
        }
        
        # Look for task-related tools
        $taskTool = $tools | Where-Object { 
            $_.name -match "task" -or 
            $_.name -match "update" -or 
            $_.name -match "status" 
        } | Select-Object -First 1
        
        if ($taskTool) {
            Write-Host "`nFound task management tool: $($taskTool.name)" -ForegroundColor Green
            
            # Define completed tasks
            $completedTasks = @(
                @{title="eBay API integration - OAuth and Set APIs"; status="Complete"; notes="OAuth flow and API integration completed"},
                @{title="Redesign product pages for comprehensive eBay listing support"; status="Complete"; notes="Product model supports all eBay fields"},
                @{title="Fix dark mode CSS variables and theme infrastructure"; status="Complete"; notes="Dark mode working throughout app"},
                @{title="Extend Prisma schema for listing workflow"; status="Complete"; notes="Schema extended with necessary fields"},
                @{title="CPI Integration: Implement parsing and normalization utilities"; status="Complete"; notes="CSV parsing utilities implemented"},
                @{title="CPI Integration: Build Import Service (upsert-by-UPC)"; status="Complete"; notes="Import service with upsert completed"},
                @{title="CPI Integration: Create /api/cpi/import endpoint"; status="Complete"; notes="Import endpoint created and tested"},
                @{title="CPI Integration: Build Export Service (Prisma to CSV)"; status="Complete"; notes="Export service completed"},
                @{title="CPI Integration: Create /api/cpi/export endpoint"; status="Complete"; notes="Export endpoint created and tested"},
                @{title="CPI Integration: Lock down CSV specification and canonical header"; status="Complete"; notes="CSV format standardized"},
                @{title="CPI Integration: Define data mapping contract (CSV to Prisma)"; status="Complete"; notes="Data mapping implemented"},
                @{title="CPI Integration: UI - Inventory page Import modal"; status="Complete"; notes="Import modal UI completed"},
                @{title="CPI Integration: UI - Inventory page Export modal"; status="Complete"; notes="Export modal UI completed"},
                @{title="CPI Integration: UI - Product detail CPI export"; status="Complete"; notes="Product detail export completed"},
                @{title="AI Magic testing"; status="Complete"; notes="AI product identification working"}
            )
            
            Write-Host "`nUpdating task statuses..." -ForegroundColor Cyan
            
            # Try to update tasks
            foreach ($task in $completedTasks) {
                Write-Host "  Updating: $($task.title)" -ForegroundColor Gray
                
                $updateParams = @{
                    name = $taskTool.name
                    arguments = $task
                }
                
                $result = Call-Archon -Method "tools/call" -Params $updateParams -SessionId $sessionId
                
                if ($result -and -not $result.error) {
                    Write-Host "     Updated successfully" -ForegroundColor Green
                } elseif ($result -and $result.error) {
                    Write-Host "     Error: $($result.error.message)" -ForegroundColor Yellow
                }
            }
        }
    }
} else {
    Write-Host "Failed to connect to Archon server" -ForegroundColor Red
    Write-Host "Make sure the Archon server is running on port 8051" -ForegroundColor Yellow
}

Write-Host "`nTask update process completed" -ForegroundColor Cyan
