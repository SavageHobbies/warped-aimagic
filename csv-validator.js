const fs = require('fs');

function validateCSV(filePath) {
  console.log('🔍 Validating CSV file:', filePath);
  console.log('=' .repeat(60));
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  if (lines.length === 0) {
    console.log('❌ File is empty');
    return;
  }
  
  // Parse header to get expected column count
  const headerLine = lines[0];
  const expectedColumns = parseCSVRow(headerLine).length;
  console.log(`📋 Expected columns: ${expectedColumns}`);
  console.log(`📊 Total lines: ${lines.length}`);
  
  const issues = [];
  let validRows = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    if (line.trim() === '') {
      continue; // Skip empty lines
    }
    
    try {
      const row = parseCSVRow(line);
      
      // Check column count
      if (row.length !== expectedColumns) {
        issues.push({
          line: lineNumber,
          type: 'COLUMN_COUNT_MISMATCH',
          expected: expectedColumns,
          actual: row.length,
          preview: line.substring(0, 100) + (line.length > 100 ? '...' : '')
        });
      }
      
      // Check for suspicious content
      row.forEach((field, fieldIndex) => {
        // Check for unescaped line breaks
        if (field.includes('\\n') || field.includes('\\r')) {
          issues.push({
            line: lineNumber,
            type: 'LINE_BREAKS_IN_FIELD',
            field: fieldIndex,
            preview: field.substring(0, 50) + '...'
          });
        }
        
        // Check for extremely long fields (possible parsing error)
        if (field.length > 2000) {
          issues.push({
            line: lineNumber,
            type: 'EXTREMELY_LONG_FIELD',
            field: fieldIndex,
            length: field.length,
            preview: field.substring(0, 50) + '...'
          });
        }
      });
      
      validRows++;
      
    } catch (error) {
      issues.push({
        line: lineNumber,
        type: 'PARSE_ERROR',
        error: error.message,
        preview: line.substring(0, 100) + (line.length > 100 ? '...' : '')
      });
    }
  }
  
  console.log(`\\n✅ Valid rows: ${validRows}`);
  console.log(`❌ Issues found: ${issues.length}`);
  
  if (issues.length > 0) {\n    console.log('\\n🚨 ISSUES DETECTED:');\n    \n    // Group issues by type\n    const groupedIssues = {};\n    issues.forEach(issue => {\n      if (!groupedIssues[issue.type]) {\n        groupedIssues[issue.type] = [];\n      }\n      groupedIssues[issue.type].push(issue);\n    });\n    \n    Object.entries(groupedIssues).forEach(([type, typeIssues]) => {\n      console.log(`\\n📍 ${type} (${typeIssues.length} occurrences):`);\n      \n      typeIssues.slice(0, 5).forEach(issue => {\n        switch (issue.type) {\n          case 'COLUMN_COUNT_MISMATCH':\n            console.log(`   Line ${issue.line}: Expected ${issue.expected} columns, got ${issue.actual}`);\n            console.log(`   Preview: ${issue.preview}`);\n            break;\n          case 'PARSE_ERROR':\n            console.log(`   Line ${issue.line}: ${issue.error}`);\n            console.log(`   Preview: ${issue.preview}`);\n            break;\n          case 'LINE_BREAKS_IN_FIELD':\n            console.log(`   Line ${issue.line}, Field ${issue.field}: Contains line breaks`);\n            console.log(`   Preview: ${issue.preview}`);\n            break;\n          case 'EXTREMELY_LONG_FIELD':\n            console.log(`   Line ${issue.line}, Field ${issue.field}: ${issue.length} characters`);\n            console.log(`   Preview: ${issue.preview}`);\n            break;\n        }\n      });\n      \n      if (typeIssues.length > 5) {\n        console.log(`   ... and ${typeIssues.length - 5} more`);\n      }\n    });\n    \n    console.log('\\n💡 RECOMMENDED FIXES:');\n    if (groupedIssues.COLUMN_COUNT_MISMATCH) {\n      console.log('   • Check for unescaped commas in text fields');\n      console.log('   • Ensure all quotes are properly escaped (\"\") or fields are quoted');\n      console.log('   • Look for line breaks within quoted fields');\n    }\n    if (groupedIssues.PARSE_ERROR) {\n      console.log('   • Fix malformed quotes or comma escaping');\n      console.log('   • Check for special characters that need escaping');\n    }\n    if (groupedIssues.LINE_BREAKS_IN_FIELD) {\n      console.log('   • Remove or escape line breaks in field content');\n    }\n  } else {\n    console.log('\\n🎉 No issues detected! CSV appears to be well-formed.');\n  }\n}\n\n// Simple CSV parser\nfunction parseCSVRow(row) {\n  const result = [];\n  let current = '';\n  let inQuotes = false;\n  \n  for (let i = 0; i < row.length; i++) {\n    const char = row[i];\n    \n    if (char === '\"') {\n      if (inQuotes && row[i + 1] === '\"') {\n        current += '\"';\n        i++; // Skip next quote\n      } else {\n        inQuotes = !inQuotes;\n      }\n    } else if (char === ',' && !inQuotes) {\n      result.push(current);\n      current = '';\n    } else {\n      current += char;\n    }\n  }\n  \n  result.push(current);\n  return result;\n}\n\n// Command line usage\nif (process.argv.length > 2) {\n  const filePath = process.argv[2];\n  if (fs.existsSync(filePath)) {\n    validateCSV(filePath);\n  } else {\n    console.log('❌ File not found:', filePath);\n  }\n} else {\n  console.log('Usage: node csv-validator.js <csv-file-path>');\n  console.log('Example: node csv-validator.js \"current funko 8-8-25 - CPI.csv\"');\n  console.log('\\nThis tool will:');\n  console.log('• Check for column count mismatches');\n  console.log('• Identify parsing errors');\n  console.log('• Detect malformed fields');\n  console.log('• Suggest fixes for common issues');\n}