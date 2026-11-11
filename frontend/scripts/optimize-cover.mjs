// Reproducible local conversion. The original remains the lossless fallback source.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/bg-17.jpg', import.meta.url));
const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    for (const width of [640, 1200]) {
        const url = await page.evaluate(async ({ data, width }) => {
            const image = new Image(); image.src = `data:image/jpeg;base64,${data}`; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = Math.min(width, image.width); canvas.height = Math.round(image.height * canvas.width / image.width);
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/webp', .82);
        }, { data: source.toString('base64'), width });
        const bytes = Buffer.from(url.split(',')[1], 'base64');
        await writeFile(new URL(`../public/bg-17-${width}.webp`, import.meta.url), bytes);
        console.log(`${width}px: ${bytes.length} bytes`);
    }
} finally { await browser.close(); }
