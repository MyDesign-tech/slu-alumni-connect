import fs from 'fs';
import path from 'path';

export interface ParsedCSVData {
  headers: string[];
  rows: any[];
}

/**
 * Parse CSV file and return structured data
 */
export function parseCSV(filePath: string): ParsedCSVData {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse rows
    const rows = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      return row;
    });

    return { headers, rows };
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    return { headers: [], rows: [] };
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
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

/**
 * Load and cache CSV data
 */
class CSVDataLoader {
  private cache: Map<string, ParsedCSVData> = new Map();
  private dataPath: string;

  constructor(dataPath: string = 'c:\\Users\\madhu\\Dheeraj\\Data') {
    this.dataPath = dataPath;
  }

  /**
   * Load CSV file with caching
   */
  load(fileName: string, forceReload: boolean = false): ParsedCSVData {
    if (!forceReload && this.cache.has(fileName)) {
      return this.cache.get(fileName)!;
    }

    const filePath = path.join(this.dataPath, fileName);
    const data = parseCSV(filePath);
    this.cache.set(fileName, data);
    
    return data;
  }

  /**
   * Clear cache for a specific file or all files
   */
  clearCache(fileName?: string) {
    if (fileName) {
      this.cache.delete(fileName);
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const csvLoader = new CSVDataLoader();
