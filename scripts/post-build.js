#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pkg = require(path.join(root, 'package.json'))

const filename = `${pkg.name}-${pkg.version}.tgz`
const src = path.join(root, filename)
const distDir = path.join(root, 'dist')
const dest = path.join(distDir, filename)

if (!fs.existsSync(src)) {
	console.error(`post-build: package file "${filename}" not found in repository root`)
	process.exit(0)
}

fs.mkdirSync(distDir, { recursive: true })

fs.copyFileSync(src, dest)
fs.unlinkSync(src)

console.log(`post-build: moved ${filename} → dist/`)
