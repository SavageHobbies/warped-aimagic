const fs = require('fs');

// Function to analyze a CSV file structure
function analyzeCSV(filePath) {
  console.log('🔍 Analyzing CSV file:', filePath);
  console.log('=' .repeat(50));
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  if (lines.length === 0) {
    console.log('❌ File is empty');
    return;
  }
  
  // Parse header row
  const headerRow = lines[0];
  const headers = parseCSVRow(headerRow);
  
  console.log('📋 Headers found:', headers.length);
  headers.forEach((header, index) => {
    console.log(`  ${index}: "${header}"`);
  });
  
  console.log('\n📊 First 3 data rows:');
  for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
    const row = parseCSVRow(lines[i]);
    console.log(`\nRow ${i}:`);
    headers.forEach((header, index) => {
      const value = row[index] || '';
      const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
      console.log(`  ${header}: "${shortValue}"`);
    });
  }
  
  // Look for common issues
  console.log('\n🔍 Potential Issues:');
  
  // Check if Title column exists
  const titleColumns = headers.filter(h => 
    h.toLowerCase().includes('title') || 
    h.toLowerCase().includes('name') ||
    h.toLowerCase().includes('product')
  );
  
  if (titleColumns.length === 0) {
    console.log('⚠️  No obvious title/name column found');
    console.log('   Expected: Title, Product Name, Name, Product Title, etc.');
  } else {
    console.log('✅ Found potential title columns:', titleColumns.join(', '));
  }
  
  // Check for image-like data in wrong places
  for (let i = 1; i <= Math.min(3, lines.length - 1); i++) {
    const row = parseCSVRow(lines[i]);
    headers.forEach((header, index) => {
      const value = row[index] || '';
      if (value.includes('http') && !header.toLowerCase().includes('image')) {
        console.log(`⚠️  Found URL in non-image column "${header}": ${value.substring(0, 50)}...`);
      }
    });
  }
}

// Simple CSV parser
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// If script is run directly, analyze the provided file
if (process.argv.length > 2) {
  const filePath = process.argv[2];
  if (fs.existsSync(filePath)) {
    analyzeCSV(filePath);
  } else {
    console.log('❌ File not found:', filePath);
  }
} else {
  console.log('Usage: node csv-analyzer.js <csv-file-path>');
  console.log('Example: node csv-analyzer.js "current funko 8-8-25 - CPI.csv"');
}