import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readJSON<T>(filename: string): T {
  const filepath = path.join(DATA_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    return (filename.includes('users') ? [] : 
            filename.includes('jobs') ? [] :
            filename.includes('resumes') ? {} :
            filename.includes('applications') ? [] :
            filename.includes('matches') ? [] :
            filename.includes('conversations') ? {} : []) as T;
  }
  
  const data = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(data);
}

export function writeJSON<T>(filename: string, data: T): void {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

export function appendToArray<T>(filename: string, item: T): void {
  const data = readJSON<T[]>(filename);
  data.push(item);
  writeJSON(filename, data);
}

export function updateInArray<T extends { id: string }>(
  filename: string,
  id: string,
  updates: Partial<T>
): T | null {
  const data = readJSON<T[]>(filename);
  const index = data.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  data[index] = { ...data[index], ...updates };
  writeJSON(filename, data);
  
  return data[index];
}

export function deleteFromArray(filename: string, id: string): boolean {
  const data = readJSON<any[]>(filename);
  const index = data.findIndex(item => item.id === id);
  
  if (index === -1) return false;
  
  data.splice(index, 1);
  writeJSON(filename, data);
  
  return true;
}
