import fs from 'fs';
import path from 'path';

// Load HTML before tests so DOM elements exist when app.js evaluates
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
document.documentElement.innerHTML = html;

// Mock Lucide icons global to prevent undefined errors
global.lucide = {
    createIcons: () => {}
};
