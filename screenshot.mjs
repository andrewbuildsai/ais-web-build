import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter((f) => f.startsWith('screenshot-'));
const nums = existing.map((f) => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0', 10));
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const suffix = label ? `-${label}` : '';
const out = path.join(dir, `screenshot-${next}${suffix}.png`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
