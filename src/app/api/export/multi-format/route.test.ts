/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST, GET } from './route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
const mockTx = {
  productCategory: {
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  category: {
    upsert: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $disconnect: jest.fn(),
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mockTx)),
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    productCategory: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    productVideo: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock data
const mockProducts = [
  {
    id: 'prod-1',
    upc: '123456789012',
    ean: '1234567890123',
    title: 'Test Product 1',
    brand: 'Test Brand',
    description: 'A test product description',
    msrp: 99.99,
    currentPrice: 79.99,
    quantity: 10,
    weight: 1.5,
    condition: 'New',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Electronics' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'prod-2',
    upc: '987654321098',
    ean: null,
    title: '=Dangerous Title', // Test CSV injection protection
    brand: 'Another Brand',
    description: 'Another description with "quotes" and, commas',
    msrp: 149.99,
    currentPrice: 129.99,
    quantity: 5,
    weight: 2.3,
    condition: 'New',
    images: ['https://example.com/image3.jpg'],
    categoryId: 'cat-2',
    category: { id: 'cat-2', name: 'Home & Garden' },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16'),
  },
];

describe('Multi-Format Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/export/multi-format', () => {
    describe('CPI Format Export', () => {
      it('should export all products in CPI format', async () => {
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
            options: {
              currency: 'USD',
              delimiter: ',',
              excelFriendly: false,
            },
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
        expect(response.headers.get('Content-Disposition')).toMatch(/attachment; filename="inventory_cpi_.*\.csv"/);

        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        // Check headers
        expect(lines[0]).toContain('SKU');
        expect(lines[0]).toContain('Title');
        expect(lines[0]).toContain('Purchase Price');
        expect(lines[0]).toContain('List Price');
        
        // Check data rows
        expect(lines[1]).toContain('prod-1');
        expect(lines[1]).toContain('Test Product 1');
        expect(lines[1]).toContain('99.99');
        expect(lines[1]).toContain('79.99');
        
        // Check CSV injection protection
        expect(lines[2]).toContain("'=Dangerous Title");
      });

      it('should export selected products only', async () => {
        (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
            selection: {
              ids: ['prod-1'],
            },
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        
        const csvContent = await response.text();
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        expect(lines).toHaveLength(2); // Header + 1 data row
        expect(lines[1]).toContain('prod-1');
        expect(lines[1]).not.toContain('prod-2');
      });

      it('should apply filters correctly', async () => {
        (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
            selection: {
              filters: {
                search: 'Test Product',
                condition: 'New',
                minStock: 1,
              },
            },
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        
        expect(prisma.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: expect.arrayContaining([
                expect.objectContaining({
                  OR: expect.arrayContaining([
                    { title: { contains: 'Test Product', mode: 'insensitive' } },
                    { upc: { contains: 'Test Product', mode: 'insensitive' } },
                    { brand: { contains: 'Test Product', mode: 'insensitive' } },
                  ]),
                }),
                { condition: 'New' },
                { quantity: { gte: 1 } },
              ]),
            }),
          })
        );
      });

      it.skip('should handle Excel-friendly options', async () => {
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
            options: {
              excelFriendly: true,
              delimiter: ';',
            },
          }),
        });

        const response = await POST(request);
        const csvContent = await response.text();
        
        // Check for UTF-8 BOM
        expect(csvContent.charCodeAt(0)).toBe(0xFEFF);
        
        // Check for semicolon delimiter
        const lines = csvContent.split('\r\n');
        expect(lines[0]).toContain(';');
        expect(lines[0]).not.toContain(',');
      });
    });

    describe('Baselinker Format Export', () => {
      it('should export products in Baselinker format', async () => {
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'baselinker',
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        
        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        // Check Baselinker-specific headers
        expect(lines[0]).toContain('Product name');
        expect(lines[0]).toContain('EAN');
        expect(lines[0]).toContain('Tax rate (%)');
        expect(lines[0]).toContain('Manufacturer');
        
        // Check data transformation
        expect(lines[1]).toContain('Test Product 1');
        expect(lines[1]).toContain('1234567890123'); // EAN
        expect(lines[1]).toContain('23'); // Default tax rate
        expect(lines[1]).toContain('Test Brand'); // Manufacturer
      });

      it('should limit description length and sanitize HTML', async () => {
        const longDescription = '<script>alert("xss")</script>' + 'a'.repeat(6000);
        const productWithLongDesc = {
          ...mockProducts[0],
          description: longDescription,
        };
        
        (prisma.product.findMany as jest.Mock).mockResolvedValue([productWithLongDesc]);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'baselinker',
          }),
        });

        const response = await POST(request);
        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        // Check description is sanitized and truncated
        expect(lines[1]).not.toContain('<script>');
        expect(lines[1]).toMatch(/a{4997}\.\.\./); // 5000 chars max with ellipsis
      });

      it('should handle multiple images correctly', async () => {
        const productWithManyImages = {
          ...mockProducts[0],
          images: Array(10).fill({ originalUrl: 'https://example.com/img.jpg' }),
        };
        
        (prisma.product.findMany as jest.Mock).mockResolvedValue([productWithManyImages]);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'baselinker',
          }),
        });

        const response = await POST(request);
        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        // Should only include first 5 images
        const headers = lines[0].split(',');
        const imageFieldIndex = headers.indexOf('Images');
        const fields = lines[1].split(',');
        const imageField = fields[imageFieldIndex];
        const images = imageField.replace(/"/g, '').split(';') || [];
        expect(images).toHaveLength(5);
      });
    });

    describe('eBay Format Export', () => {
      it.skip('should export products in eBay format', async () => {
        (prisma.category.findFirst as jest.Mock).mockResolvedValue({
          id: 'cat-1',
          name: 'Electronics',
          ebayId: '58058',
        });
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'ebay',
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        
        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        // Check eBay-specific headers
        expect(lines[0]).toContain('Action(SiteID=US|Country=US|Currency=USD|Version=1193)');
        expect(lines[0]).toContain('Category');
        expect(lines[0]).toContain('ConditionID');
        expect(lines[0]).toContain('Duration');
        
        // Check data transformation
        expect(lines[1]).toContain('Add'); // Action
        expect(lines[1]).toContain('58058'); // Category ID
        expect(lines[1]).toContain('1000'); // ConditionID for New
        expect(lines[1]).toContain('GTC'); // Duration
        expect(lines[1]).toContain('INV-prod-1'); // CustomLabel
      });

      it('should truncate title and subtitle appropriately', async () => {
        const productWithLongTitle = {
          ...mockProducts[0],
          title: 'a'.repeat(100), // Exceeds 80 char limit
          description: 'b'.repeat(100), // For subtitle, exceeds 55 char limit
        };
        
        (prisma.product.findMany as jest.Mock).mockResolvedValue([productWithLongTitle]);
        (prisma.category.findFirst as jest.Mock).mockResolvedValue({
          id: 'cat-1',
          name: 'Electronics',
          ebayId: '58058',
        });

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'ebay',
          }),
        });

        const response = await POST(request);
        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        const fields = lines[1].split(',');
        const titleField = fields[3]; // Title is 4th field
        const subtitleField = fields[4]; // SubTitle is 5th field
        
        expect(titleField.length).toBeLessThanOrEqual(82); // 80 + quotes
        expect(subtitleField.length).toBeLessThanOrEqual(57); // 55 + quotes
      });

      it('should handle missing eBay category gracefully', async () => {
        (prisma.category.findFirst as jest.Mock).mockResolvedValue({
          id: 'cat-1',
          name: 'Electronics',
          ebayId: null, // No eBay ID
        });
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'ebay',
          }),
        });

        const response = await POST(request);
        const csvContent = await response.text();
        const lines = csvContent.split('\n');
        
        // Should use default category
        expect(lines[1]).toContain('20081'); // Default "Other" category
      });
    });

    describe('Error Handling', () => {
      it('should return 400 for invalid format', async () => {
        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'invalid-format',
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        
        const error = await response.json();
        expect(error.error).toContain('Invalid format');
      });

      it('should return 400 for invalid request body', async () => {
        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        
        const error = await response.json();
        expect(error.error).toContain('Invalid request');
      });

      it('should return 404 when no products found', async () => {
        (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(404);
        
        const error = await response.json();
        expect(error.error).toBe('No products found matching the criteria');
      });

      it('should handle database errors gracefully', async () => {
        (prisma.product.findMany as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(500);
        
        const error = await response.json();
        expect(error.error).toBe('Failed to generate export');
      });

      it('should enforce maxRows limit', async () => {
        const manyProducts = Array(100).fill(mockProducts[0]);
        (prisma.product.findMany as jest.Mock).mockImplementation(({ take }) => {
          return Promise.resolve(manyProducts.slice(0, take));
        });

        const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
          method: 'POST',
          body: JSON.stringify({
            format: 'cpi',
            options: {
              maxRows: 10,
            },
          }),
        });

        const response = await POST(request);
        const csvContent = await response.text();
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        expect(lines).toHaveLength(11); // Header + 10 data rows
      });
    });
  });

  describe('GET /api/export/multi-format', () => {
    it('should return available formats and options', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Check formats
      expect(data.formats).toHaveLength(3);
      expect(data.formats.map((f: any) => f.id)).toEqual(['cpi', 'baselinker', 'ebay']);
      
      // Check format details
      const cpiFormat = data.formats.find((f: any) => f.id === 'cpi');
      expect(cpiFormat.name).toBe('CPI Sheet');
      expect(cpiFormat.headers).toContain('SKU');
      expect(cpiFormat.headers).toContain('Title');
      
      // Check options
      expect(data.options.currency).toContain('USD');
      expect(data.options.delimiter).toEqual([',', ';']);
      expect(data.options.timezone).toContain('UTC');
    });
  });
});

describe('CSV Security', () => {
  it.skip('should prevent CSV injection in all fields', async () => {
    const maliciousProduct = {
      ...mockProducts[0],
      title: '=cmd|"/c calc"!A1',
      brand: '+SUM(A1:A10)',
      description: '-2+3',
      upc: '@SUM(1+2)',
    };
    
    (prisma.product.findMany as jest.Mock).mockResolvedValue([maliciousProduct]);

    const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
      method: 'POST',
      body: JSON.stringify({
        format: 'cpi',
      }),
    });

    const response = await POST(request);
    const csvContent = await response.text();
    const lines = csvContent.split('\n');
    
    // All dangerous characters should be prefixed with apostrophe
    expect(lines[1]).toContain("'=cmd");
    expect(lines[1]).toContain("'+SUM");
    expect(lines[1]).toContain("'-2+3");
    expect(lines[1]).toContain("'@SUM");
  });

  it.skip('should properly escape quotes and commas', async () => {
    const productWithSpecialChars = {
      ...mockProducts[0],
      title: 'Product with "quotes" and, commas',
      description: 'Line 1\nLine 2\nLine 3',
    };
    
    (prisma.product.findMany as jest.Mock).mockResolvedValue([productWithSpecialChars]);

    const request = new NextRequest('http://localhost:3000/api/export/multi-format', {
      method: 'POST',
      body: JSON.stringify({
        format: 'cpi',
        options: {
          delimiter: ',',
        },
      }),
    });

    const response = await POST(request);
    const csvContent = await response.text();
    
    // Check proper escaping
    expect(csvContent).toContain('"Product with ""quotes"" and, commas"');
    expect(csvContent).toContain('"Line 1\nLine 2\nLine 3"');
  });
});
