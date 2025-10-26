#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pkg = require(path.join(root, 'package.json'))
const manifest = require(path.join(root, 'companion/manifest.json'))

const baseCandidates = [pkg.name, manifest?.id, manifest?.shortname].filter(
	(value, index, arr) => value && arr.indexOf(value) === index,
)

let sourceFilename = null
for (const base of baseCandidates) {
	const candidate = `${base}-${pkg.version}.tgz`
	if (fs.existsSync(path.join(root, candidate))) {
		sourceFilename = candidate
		break
	}
}

if (!sourceFilename) {
	console.error(`post-build: package file for version ${pkg.version} not found in repository root`)
	process.exit(0)
}

const finalFilename = `${pkg.name}-${pkg.version}.tgz`
const src = path.join(root, sourceFilename)
const distDir = path.join(root, 'dist')
const dest = path.join(distDir, finalFilename)

fs.mkdirSync(distDir, { recursive: true })

fs.copyFileSync(src, dest)
fs.unlinkSync(src)

if (sourceFilename !== finalFilename) {
	console.log(`post-build: renamed ${sourceFilename} → ${finalFilename} and moved to dist/`)
} else {
	console.log(`post-build: moved ${finalFilename} → dist/`)
}
