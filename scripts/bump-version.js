#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const semver = require('semver')

const mode = process.argv[2]
const identifier = process.argv[3] || 'beta'

if (!mode) {
	console.error('Usage: yarn bump -- <major|minor|patch|beta|<version>> [identifier]')
	process.exit(1)
}

const root = path.resolve(__dirname, '..')

function readJSON(relativePath) {
	const filePath = path.join(root, relativePath)
	const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
	return { filePath, data }
}

function writeJSON(filePath, data) {
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const { filePath: pkgPath, data: pkg } = readJSON('package.json')
const currentVersion = pkg.version

function nextVersion(current, option) {
	if (semver.valid(option)) {
		return option
	}

	switch (option) {
		case 'major':
		case 'minor':
		case 'patch':
			return semver.inc(current, option)
		case 'beta': {
			const prerelease = semver.prerelease(current)
			const base = prerelease ? current : semver.inc(current, 'patch')
			return semver.inc(base, 'prerelease', prerelease?.[0] ?? identifier)
		}
		default:
			console.error(`Unsupported bump type "${option}".`)
			process.exit(1)
	}
}

const newVersion = nextVersion(currentVersion, mode)

pkg.version = newVersion
writeJSON(pkgPath, pkg)

const { filePath: manifestPath, data: manifest } = readJSON('companion/manifest.json')
manifest.version = newVersion
writeJSON(manifestPath, manifest)

const lockFiles = ['package-lock.json', 'package-lock 2.json']
for (const lockFile of lockFiles) {
	const fullPath = path.join(root, lockFile)
	if (!fs.existsSync(fullPath)) continue

	const lockData = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
	if (lockData.version) {
		lockData.version = newVersion
	}
	if (lockData.packages?.['']) {
		lockData.packages[''].version = newVersion
	}
	writeJSON(fullPath, lockData)
}

console.log(`Version bumped: ${currentVersion} → ${newVersion}`)
