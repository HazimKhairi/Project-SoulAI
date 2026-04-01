// tests/unit/package-structure.test.js
import { describe, it, expect } from 'vitest'
import pkg from '../../package.json' assert { type: 'json' }

describe('Package.json Structure', () => {
  it('should have correct package name', () => {
    expect(pkg.name).toBe('soulai')
  })

  it('should have bin entry', () => {
    expect(pkg.bin).toHaveProperty('soulai')
    expect(pkg.bin.soulai).toBe('./bin/soulai.js')
  })

  it('should have postinstall script', () => {
    expect(pkg.scripts).toHaveProperty('postinstall')
  })

  it('should have required dependencies', () => {
    expect(pkg.dependencies).toHaveProperty('inquirer')
    expect(pkg.dependencies).toHaveProperty('chalk')
    expect(pkg.dependencies).toHaveProperty('@modelcontextprotocol/sdk')
  })
})
