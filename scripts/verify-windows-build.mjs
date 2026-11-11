// Validate the PE resource directory, not incidental strings embedded in Go code.
// Usage: node scripts/verify-windows-build.mjs bin/BASSAPSLauncher.exe
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const file = process.argv[2];
assert(file, 'Executable path is required');
const bytes = readFileSync(file);
const pe = bytes.readUInt32LE(0x3c);
assert.equal(bytes.toString('ascii', pe, pe + 4), 'PE\0\0', 'Invalid PE image');
const count = bytes.readUInt16LE(pe + 6);
const optional = pe + 24;
const size = bytes.readUInt16LE(pe + 20);
const directory = optional + (bytes.readUInt16LE(optional) === 0x20b ? 112 : 96);
const resourceRVA = bytes.readUInt32LE(directory + 16);
assert(resourceRVA, 'Missing Windows resource directory');
function offset(rva) {
    for (let i = 0; i < count; i++) {
        const section = optional + size + i * 40;
        const va = bytes.readUInt32LE(section + 12);
        const length = Math.max(bytes.readUInt32LE(section + 8), bytes.readUInt32LE(section + 16));
        if (rva >= va && rva < va + length) return bytes.readUInt32LE(section + 20) + rva - va;
    }
    throw new Error(`Resource RVA is outside all sections: ${rva}`);
}
const base = offset(resourceRVA);
const manifests = [];
function walk(relative, ids = []) {
    assert(ids.length <= 3, 'Unexpected resource depth');
    const at = base + relative;
    const entries = bytes.readUInt16LE(at + 12) + bytes.readUInt16LE(at + 14);
    for (let i = 0; i < entries; i++) {
        const entry = at + 16 + i * 8;
        const id = bytes.readUInt32LE(entry);
        const value = bytes.readUInt32LE(entry + 4);
        if (value & 0x80000000) walk(value & 0x7fffffff, [...ids, id]);
        else if (ids[0] === 24 && ids[1] === 1) {
            const data = base + value;
            const start = offset(bytes.readUInt32LE(data));
            manifests.push(bytes.subarray(start, start + bytes.readUInt32LE(data + 4)).toString('utf8'));
        }
    }
}
walk(0);
assert(manifests.length, 'Application manifest resource #1 is missing');
for (const manifest of manifests) assert.match(manifest, /<requestedExecutionLevel\b[^>]*\blevel=["']requireAdministrator["']/, 'Launcher must request administrator rights');
console.log(`Verified administrator manifest: ${file}`);
