// tests/unit/claim-validator.test.js
import { describe, it, expect } from 'vitest'
import { ClaimValidator } from '../../servers/verification-server/validators/claim-validator.js'
import path from 'path'

describe('Claim Validator', () => {
  const projectRoot = path.resolve(process.cwd())

  it('should validate command execution claim', async () => {
    const validator = new ClaimValidator()
    const result = await validator.verifyCommandClaim({
      claim: 'Node.js is installed',
      command: 'node --version',
      expectedOutput: /v\d+\.\d+\.\d+/
    })

    expect(result.success).toBe(true)
    expect(result.verified).toBe(true)
  })

  it('should reject false command claim', async () => {
    const validator = new ClaimValidator()
    const result = await validator.verifyCommandClaim({
      claim: 'Nonexistent command works',
      command: 'nonexistent-command-xyz --version',
      expectedOutput: /./
    })

    expect(result.success).toBe(true)
    expect(result.verified).toBe(false)
  })

  it('should validate file existence claim', async () => {
    const validator = new ClaimValidator()
    const result = await validator.verifyFileClaim({
      claim: 'package.json exists',
      filePath: path.join(projectRoot, 'package.json'),
      shouldExist: true
    })

    expect(result.success).toBe(true)
    expect(result.verified).toBe(true)
  })

  it('should validate code structure claim', async () => {
    const validator = new ClaimValidator()
    const result = await validator.verifyCodeStructureClaim({
      claim: 'IPCClient class exists',
      filePath: path.join(projectRoot, 'orchestrator/ipc-client.js'),
      pattern: /class\s+IPCClient/
    })

    expect(result.success).toBe(true)
    expect(result.verified).toBe(true)
  })

  it('should validate API endpoint claim', async () => {
    const validator = new ClaimValidator()
    const result = await validator.verifyApiClaim({
      claim: 'Localhost responds on port (invalid for testing)',
      url: 'http://localhost:99999',
      timeout: 100
    })

    expect(result.success).toBe(true)
    expect(result.verified).toBe(false)
  })
})
