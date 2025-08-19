/**
 * Integration tests for multi-format export functionality
 * Tests the complete export flow including UI interactions and API calls
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data setup
const testProducts = [
  {
    id: 'test-product-1',
    upc: '123456789012',
    ean: '1234567890123',
    title: 'Integration Test Product 1',
    brand: 'Test Brand A',
    description: 'Test description for product 1',
    msrp: 99.99,
    currentPrice: 79.99,
    quantity: 10,
    weight: 1.5,
    condition: 'New',
    images: ['https://example.com/test1.jpg'],
    categoryId: null,
  },
  {
    id: 'test-product-2',
    upc: '987654321098',
    ean: '9876543210987',
    title: 'Integration Test Product 2',
    brand: 'Test Brand B',
    description: 'Test description for product 2',
    msrp: 149.99,
    currentPrice: 129.99,
    quantity: 5,
    weight: 2.3,
    condition: 'Used',
    images: ['https://example.com/test2.jpg'],
    categoryId: null,
  },
];

test.describe('Multi-Format Export Integration', () => {
  test.beforeAll(async () => {
    // Clean up any existing test data
    await prisma.product.deleteMany({
      where: {
        id: {
          in: testProducts.map(p => p.id),
        },
      },
    });

    // Insert test products
    await prisma.product.createMany({
      data: testProducts,
    });
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: {
        id: {
          in: testProducts.map(p => p.id),
        },
      },
    });
    await prisma.$disconnect();
  });

  test('should display export button on inventory page', async ({ page }) => {
    await page.goto('/inventory');
    
    // Wait for inventory to load
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 });
    
    // Check export button exists
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
  });

  test('should show export format dropdown on button click', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Check dropdown menu appears with all formats
    await expect(page.locator('text="Export to CPI"')).toBeVisible();
    await expect(page.locator('text="Export to Baselinker"')).toBeVisible();
    await expect(page.locator('text="Export to eBay"')).toBeVisible();
  });

  test('should open export modal with options', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Open export dropdown
    await page.click('button:has-text("Export")');
    
    // Select CPI format
    await page.click('text="Export to CPI"');
    
    // Check modal appears
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Export to CPI")')).toBeVisible();
    
    // Check export options are present
    await expect(page.locator('text="Export Scope"')).toBeVisible();
    await expect(page.locator('text="Export Options"')).toBeVisible();
    await expect(page.locator('label:has-text("Currency")')).toBeVisible();
    await expect(page.locator('label:has-text("CSV Delimiter")')).toBeVisible();
    await expect(page.locator('label:has-text("Include UTF-8 BOM")')).toBeVisible();
  });

  test('should export all filtered products in CPI format', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Apply search filter
    await page.fill('input[placeholder*="Search"]', 'Integration Test');
    await page.waitForTimeout(500); // Wait for debounce
    
    // Start export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to CPI"');
    
    // Configure export options
    await page.click('input[value="all"]'); // Select all filtered products
    await page.selectOption('select[name="currency"]', 'USD');
    await page.selectOption('select[name="delimiter"]', ',');
    
    // Setup download promise before clicking export
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button in modal
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    expect(download.suggestedFilename()).toMatch(/inventory_cpi_.*\.csv/);
    
    // Save and read the file
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    
    // Verify content
    expect(content).toContain('SKU');
    expect(content).toContain('Title');
    expect(content).toContain('Integration Test Product');
  });

  test('should export selected products only', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Select first product
    await page.click('input[type="checkbox"][data-product-id="test-product-1"]');
    
    // Start export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to Baselinker"');
    
    // Select "selected products only"
    await page.click('input[value="selected"]');
    
    // Setup download promise
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    expect(download.suggestedFilename()).toMatch(/inventory_baselinker_.*\.csv/);
    
    // Read content
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    
    // Verify only selected product is exported
    expect(content).toContain('Integration Test Product 1');
    expect(content).not.toContain('Integration Test Product 2');
  });

  test('should handle Excel-friendly export with UTF-8 BOM', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Start export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to CPI"');
    
    // Enable Excel-friendly options
    await page.check('input[name="excelFriendly"]');
    await page.selectOption('select[name="delimiter"]', ';');
    
    // Setup download promise
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Wait for download
    const download = await downloadPromise;
    const path = await download.path();
    
    // Read file as buffer to check BOM
    const fs = require('fs');
    const buffer = fs.readFileSync(path);
    
    // Check for UTF-8 BOM (EF BB BF)
    expect(buffer[0]).toBe(0xEF);
    expect(buffer[1]).toBe(0xBB);
    expect(buffer[2]).toBe(0xBF);
    
    // Check content uses semicolon delimiter
    const content = buffer.toString('utf-8');
    expect(content).toContain(';');
    expect(content.split('\n')[0].split(';').length).toBeGreaterThan(5);
  });

  test('should show error when no products match criteria', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Apply filter that matches no products
    await page.fill('input[placeholder*="Search"]', 'NonExistentProduct12345');
    await page.waitForTimeout(500);
    
    // Try to export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to CPI"');
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Check for error message
    await expect(page.locator('text="No products found"')).toBeVisible({ timeout: 5000 });
  });

  test('should export to eBay format with proper field mapping', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Start eBay export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to eBay"');
    
    // Setup download promise
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Wait for download
    const download = await downloadPromise;
    const path = await download.path();
    
    // Read and verify eBay-specific content
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    
    // Check eBay-specific headers
    expect(content).toContain('Action(SiteID=US|Country=US|Currency=USD|Version=1193)');
    expect(content).toContain('Category');
    expect(content).toContain('ConditionID');
    expect(content).toContain('Duration');
    expect(content).toContain('BuyItNowPrice');
    
    // Check data transformation
    const lines = content.split('\n');
    if (lines[1]) {
      expect(lines[1]).toContain('Add'); // Action
      expect(lines[1]).toContain('GTC'); // Duration
      expect(lines[1]).toContain('1000'); // ConditionID for New
    }
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Open export modal
    await page.click('button:has-text("Export")');
    await page.click('text="Export to CPI"');
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Modal should be hidden
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should maintain filter state after export', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Apply filter
    await page.fill('input[placeholder*="Search"]', 'Test Brand A');
    await page.waitForTimeout(500);
    
    // Export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to CPI"');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    await downloadPromise;
    
    // Check filter is still applied
    await expect(page.locator('input[placeholder*="Search"]')).toHaveValue('Test Brand A');
    
    // Verify filtered results are still shown
    await expect(page.locator('text="Integration Test Product 1"')).toBeVisible();
    await expect(page.locator('text="Integration Test Product 2"')).not.toBeVisible();
  });

  test('should handle concurrent exports', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForSelector('[data-testid="inventory-table"]');
    
    // Start first export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to CPI"');
    
    const downloadPromise1 = page.waitForEvent('download');
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Quickly start second export
    await page.click('button:has-text("Export")');
    await page.click('text="Export to Baselinker"');
    
    const downloadPromise2 = page.waitForEvent('download');
    await page.click('button:has-text("Export"):not(:has-text("to"))');
    
    // Both downloads should complete
    const [download1, download2] = await Promise.all([downloadPromise1, downloadPromise2]);
    
    expect(download1.suggestedFilename()).toMatch(/inventory_cpi_.*\.csv/);
    expect(download2.suggestedFilename()).toMatch(/inventory_baselinker_.*\.csv/);
  });
});

test.describe('Export Format Validation', () => {
  test('CPI format should include all required fields', async ({ request }) => {
    const response = await request.post('/api/export/multi-format', {
      data: {
        format: 'cpi',
        options: {
          currency: 'USD',
        },
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const content = await response.text();
    
    // Verify all CPI headers are present
    const expectedHeaders = [
      'SKU', 'Title', 'Purchase Price', 'List Price', 'Quantity',
      'Category', 'Supplier', 'Location', 'Barcode', 'Weight (kg)',
      'Currency', 'Last Updated', 'Notes'
    ];
    
    expectedHeaders.forEach(header => {
      expect(content).toContain(header);
    });
  });

  test('Baselinker format should include VAT and manufacturer', async ({ request }) => {
    const response = await request.post('/api/export/multi-format', {
      data: {
        format: 'baselinker',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const content = await response.text();
    
    // Verify Baselinker-specific headers
    expect(content).toContain('Tax rate (%)');
    expect(content).toContain('Manufacturer');
    expect(content).toContain('EAN');
    expect(content).toContain('Product name');
  });

  test('eBay format should include marketplace-specific fields', async ({ request }) => {
    const response = await request.post('/api/export/multi-format', {
      data: {
        format: 'ebay',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const content = await response.text();
    
    // Verify eBay-specific format
    expect(content).toContain('Action(SiteID=US|Country=US|Currency=USD|Version=1193)');
    expect(content).toContain('CustomLabel');
    expect(content).toContain('ItemSpecifics');
  });
});

test.describe('Export Security', () => {
  test('should sanitize CSV injection attempts', async ({ request }) => {
    // Create a product with potentially dangerous content
    const dangerousProduct = await prisma.product.create({
      data: {
        id: 'dangerous-product',
        title: '=cmd|"/c calc"!A1',
        brand: '+SUM(A1:A10)',
        description: '@SUM(1+2)',
        upc: '-2+3',
        msrp: 99.99,
        currentPrice: 79.99,
        quantity: 1,
        condition: 'New',
      },
    });

    try {
      const response = await request.post('/api/export/multi-format', {
        data: {
          format: 'cpi',
          selection: {
            ids: [dangerousProduct.id],
          },
        },
      });
      
      const content = await response.text();
      
      // Verify dangerous characters are prefixed with apostrophe
      expect(content).toContain("'=cmd");
      expect(content).toContain("'+SUM");
      expect(content).toContain("'@SUM");
      expect(content).toContain("'-2+3");
      
      // Ensure original dangerous strings are not present
      expect(content).not.toContain('","=cmd');
      expect(content).not.toContain('","+SUM');
    } finally {
      // Clean up
      await prisma.product.delete({
        where: { id: dangerousProduct.id },
      });
    }
  });
});
