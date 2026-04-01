# Anti-Hallucination Framework for SoulAI

**Version:** 1.0
**Last Updated:** April 1, 2026
**Purpose:** Prevent AI hallucinations in coding workflows using grounding, verification, and validation techniques

---

## Table of Contents
1. [Understanding AI Hallucinations](#understanding-ai-hallucinations)
2. [Wikipedia's Lessons on AI Detection](#wikipedias-lessons-on-ai-detection)
3. [SoulAI Anti-Hallucination Architecture](#soulai-anti-hallucination-architecture)
4. [Prevention Techniques](#prevention-techniques)
5. [Verification Server Implementation](#verification-server-implementation)
6. [Testing & Validation](#testing--validation)
7. [Human-in-the-Loop Safeguards](#human-in-the-loop-safeguards)

---

## Understanding AI Hallucinations

### What Are AI Hallucinations?

AI hallucinations occur when language models generate **plausible-sounding but factually incorrect or fabricated information**. In coding contexts, this includes:

- **Phantom Files**: Claiming files exist when they don't
- **Imaginary Functions**: Referencing functions/classes that aren't in the codebase
- **Fake Dependencies**: Suggesting packages that don't exist or aren't installed
- **Fabricated API Endpoints**: Claiming routes exist that were never created
- **False Change Claims**: Saying "I modified X" when nothing changed
- **Hallucinated Documentation**: Citing non-existent docs or wrong syntax

### The Real Danger (From Wikipedia Research)

According to [Wiki Education's 2025 research on Generative AI](https://wikiedu.org/blog/2026/01/29/generative-ai-and-wikipedia-editing-what-we-learned-in-2025/):

> **67% of AI-generated articles failed verification** — citations appeared legitimate, but the actual information didn't match the sources cited.

> Only **7% had fake sources** — the rest had real, relevant sources with **wrong information**.

**Key Insight:** The most insidious hallucinations aren't obviously fake. They cite real sources with plausible-sounding but incorrect information.

---

## Wikipedia's Lessons on AI Detection

### Detection Challenges

From [Wikipedia's AI detection guidelines](https://en.wikipedia.org/wiki/Wikipedia:AI_detection_is_not_a_content_policy):

1. **AI detection tools have non-trivial error rates** — don't solely rely on automated detection
2. **Expert users detect AI ~90% accurately** — meaning 1 in 10 tags is a false positive
3. **Human review is critical** — automated tools supplement, not replace, human judgment

### Wikipedia's Anti-AI Writing Framework

[Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) identifies red flags:

- **Weasel words**: "It's worth noting", "Delve into", "In the ever-evolving landscape"
- **Vague claims without specifics**
- **Over-formal tone** in conversational contexts
- **Citations that don't match content** (the 67% problem)

**Application to SoulAI:** We adapt these principles to detect hallucinated code changes.

---

## SoulAI Anti-Hallucination Architecture

### Core Principle: **Grounding + Verification + Validation**

```
┌─────────────────────────────────────────────────────────┐
│               AI Agent Makes Claim                      │
│          "I modified login() in auth.js"                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          1. GROUNDING (Pre-Execution)                   │
│   - Check auth.js exists                                │
│   - Verify login() function exists in file              │
│   - Confirm file is tracked in git                      │
└────────────────────┬────────────────────────────────────┘
                     │ ✓ File exists, function found
                     ▼
┌─────────────────────────────────────────────────────────┐
│          2. VERIFICATION (Post-Execution)               │
│   - Run: git diff auth.js                               │
│   - Confirm login() appears in diff                     │
│   - Check tests still pass                              │
└────────────────────┬────────────────────────────────────┘
                     │ ✓ Changes verified
                     ▼
┌─────────────────────────────────────────────────────────┐
│          3. VALIDATION (Cross-Check)                    │
│   - Extract actual changes from diff                    │
│   - Compare with AI's claim                             │
│   - Flag mismatches as hallucination                    │
└────────────────────┬────────────────────────────────────┘
                     │ ✓ Claim matches reality
                     ▼
                  SUCCESS ✅
```

---

## Prevention Techniques

### 1. **Retrieval-Augmented Generation (RAG)**

**Source:** [You.com AI Hallucination Prevention Guide](https://you.com/resources/ai-hallucination-prevention-guide)

> RAG allows models to pull information from external, verified sources in real-time, significantly reducing hallucination by grounding responses in up-to-date, accurate information.

**SoulAI Implementation:**
```javascript
// Before claiming to modify a file
const fileContent = await readFile('src/auth.js')  // RAG: Retrieve actual content
const functions = extractFunctions(fileContent)     // Ground in reality

if (!functions.includes('login')) {
  throw new Error('login() not found - preventing hallucination')
}

// Now safe to proceed
await modifyFunction('login', changes)
```

**Applied to all servers:**
- **Design Server**: Retrieve actual component code before claiming to modify
- **Claude Code Server**: Pull real documentation before suggesting patterns
- **Search Server**: Verify URLs are reachable before citing them

---

### 2. **Grounding Techniques**

**Source:** [K2View: What is Grounding in AI](https://www.k2view.com/blog/what-is-grounding-and-hallucinations-in-ai/)

> Grounding is anchoring LLM responses in enterprise data by retrieving the most relevant information, helping generate more accurate responses.

**SoulAI Grounding Layers:**

#### Layer 1: Filesystem Grounding
```javascript
// Always check filesystem before claiming file operations
async function groundedFileEdit(path, changes) {
  const exists = await fs.access(path).catch(() => false)
  if (!exists) {
    return { error: 'File not found - cannot hallucinate edits' }
  }

  const content = await fs.readFile(path, 'utf8')
  return { exists: true, content, canProceed: true }
}
```

#### Layer 2: Git Grounding
```javascript
// Ground in git history
async function groundedGitClaim(file, operation) {
  const isTracked = await exec(`git ls-files ${file}`)
  const hasChanges = await exec(`git diff ${file}`)

  return {
    tracked: isTracked.length > 0,
    modified: hasChanges.length > 0,
    canClaim: isTracked.length > 0
  }
}
```

#### Layer 3: Dependency Grounding
```javascript
// Ground in package.json
async function groundedDependencyCheck(packageName) {
  const pkgJson = JSON.parse(await fs.readFile('package.json'))
  const allDeps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies
  }

  return {
    installed: packageName in allDeps,
    version: allDeps[packageName] || null
  }
}
```

---

### 3. **Verification Methods**

**Source:** [Anthropic Claude: Reduce Hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)

> For tasks involving long documents, asking Claude to **extract word-for-word quotes first** before performing its task grounds responses in actual text, reducing hallucinations.

**Quote-First Pattern:**
```javascript
// Bad: Direct claim
"I'll update the error handling in the login function"

// Good: Quote-first verification
"Here's the current error handling in login():
```
try {
  await authenticate(user)
} catch (err) {
  console.log(err)  // Line 42
}
```
I'll improve this by adding proper error messages."
```

**Best-of-N Verification:**
```javascript
// Run same prompt multiple times, compare outputs
async function verifyConsistency(prompt, n = 3) {
  const results = await Promise.all(
    Array(n).fill(null).map(() => llm.generate(prompt))
  )

  const allSame = results.every(r => r === results[0])
  if (!allSame) {
    return {
      warning: 'Inconsistent outputs detected - possible hallucination',
      results
    }
  }

  return { verified: true, result: results[0] }
}
```

---

### 4. **Prompt Engineering Strategies**

**Source:** [Microsoft: Best Practices for Mitigating Hallucinations](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/best-practices-for-mitigating-hallucinations-in-large-language-models-llms/4403129)

> **Chain of thought prompting** can considerably reduce hallucinations by enabling complex reasoning capabilities through intermediate reasoning steps.

**SoulAI Prompt Templates:**

#### Template 1: Chain-of-Thought for Code Changes
```
Before modifying code, think step-by-step:

1. Does the file exist? Check: ls src/auth.js
2. Does the function exist? Check: grep -n "function login" src/auth.js
3. What does it currently do? Read: cat src/auth.js | sed -n '42,58p'
4. What exactly needs to change? List specific lines
5. Are there tests? Check: find . -name "*auth*.test.js"
6. Will this break anything? Consider: dependencies, imports, callers

Only after answering ALL questions, proceed with changes.
```

#### Template 2: Low Temperature for Factual Tasks
```javascript
// High temperature (0.7-1.0) = creative, higher hallucination risk
// Low temperature (0.1-0.4) = deterministic, grounded

const config = {
  fileOperations: { temperature: 0.2 },   // Factual, must be accurate
  codeGeneration: { temperature: 0.4 },   // Some creativity, but grounded
  brainstorming: { temperature: 0.8 }     // Creative, hallucination ok
}
```

---

## Verification Server Implementation

### Architecture

```
verification-server/
├── index.js                      # MCP server entry
├── validators/
│   ├── file-validator.js         # Filesystem checks
│   ├── code-validator.js         # Function/class existence
│   ├── dependency-validator.js   # Package.json verification
│   ├── git-validator.js          # Git history grounding
│   └── claim-validator.js        # Cross-check AI claims
├── strategies/
│   ├── pre-execution.js          # Check BEFORE action
│   ├── post-execution.js         # Validate AFTER action
│   ├── diff-analyzer.js          # Git diff comparison
│   └── quote-extractor.js        # Extract quotes for verification
└── guardrails/
    ├── hallucination-detector.js # Detect common hallucination patterns
    ├── consistency-checker.js    # Best-of-N verification
    └── human-review-trigger.js   # When to escalate to human
```

### Core Validators

#### 1. File Validator
```javascript
// validators/file-validator.js
export async function verifyFileExists(path) {
  try {
    await fs.access(path, fs.constants.F_OK)
    const stats = await fs.stat(path)

    return {
      exists: true,
      isFile: stats.isFile(),
      size: stats.size,
      lastModified: stats.mtime
    }
  } catch {
    return {
      exists: false,
      error: `File not found: ${path}`,
      suggestion: await findSimilarFiles(path)  // "Did you mean X?"
    }
  }
}

async function findSimilarFiles(targetPath) {
  const dir = path.dirname(targetPath)
  const filename = path.basename(targetPath)
  const files = await fs.readdir(dir)

  // Fuzzy match similar filenames
  return files
    .filter(f => levenshtein(f, filename) < 3)
    .slice(0, 3)
}
```

#### 2. Code Validator
```javascript
// validators/code-validator.js
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export async function verifyFunctionExists(filePath, functionName) {
  const code = await fs.readFile(filePath, 'utf8')
  const ast = parse(code, { sourceType: 'module' })

  const functions = []
  traverse(ast, {
    FunctionDeclaration(path) {
      functions.push(path.node.id.name)
    },
    VariableDeclarator(path) {
      if (path.node.init?.type === 'ArrowFunctionExpression') {
        functions.push(path.node.id.name)
      }
    }
  })

  return {
    exists: functions.includes(functionName),
    allFunctions: functions,
    suggestion: functions.includes(functionName)
      ? null
      : `Did you mean: ${findClosestMatch(functionName, functions)}?`
  }
}
```

#### 3. Claim Validator (The 67% Problem Solver)
```javascript
// validators/claim-validator.js

/**
 * Solves Wikipedia's 67% problem:
 * AI cites real sources but info doesn't match
 *
 * In coding: AI claims to modify real files but changes don't match
 */
export async function validateClaim(claim, reality) {
  const issues = []

  // Check: Did AI claim to modify a file?
  if (claim.type === 'file_modification') {
    const diff = await exec(`git diff ${claim.file}`)

    // No diff = hallucination
    if (!diff.trim()) {
      issues.push({
        severity: 'high',
        type: 'phantom_change',
        message: `AI claimed to modify ${claim.file} but git diff shows no changes`
      })
    }

    // Diff exists but doesn't match claim
    if (diff && !diffMatchesClaim(diff, claim.description)) {
      issues.push({
        severity: 'medium',
        type: 'mismatched_claim',
        message: `Changes in ${claim.file} don't match AI's description`,
        expected: claim.description,
        actual: extractDiffSummary(diff)
      })
    }
  }

  // Check: Did AI claim to add a function?
  if (claim.type === 'function_addition') {
    const code = await fs.readFile(claim.file, 'utf8')
    const functionExists = code.includes(`function ${claim.functionName}`) ||
                          code.includes(`const ${claim.functionName} =`)

    if (!functionExists) {
      issues.push({
        severity: 'high',
        type: 'phantom_function',
        message: `AI claimed to add ${claim.functionName}() but function not found in ${claim.file}`
      })
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    hallucinationDetected: issues.some(i => i.severity === 'high')
  }
}

function diffMatchesClaim(diff, description) {
  // Extract key terms from AI's description
  const claimKeywords = extractKeywords(description)

  // Check if diff contains those keywords
  const diffContent = diff.toLowerCase()
  const matchCount = claimKeywords.filter(kw =>
    diffContent.includes(kw.toLowerCase())
  ).length

  // At least 70% of claimed keywords should appear in diff
  return (matchCount / claimKeywords.length) >= 0.7
}
```

---

### Pre-Execution Strategy

```javascript
// strategies/pre-execution.js

/**
 * Run BEFORE AI makes any code changes
 * Prevent hallucinations by checking reality first
 */
export async function preExecutionCheck(operation) {
  const checks = []

  // 1. File existence check
  if (operation.targetFile) {
    const fileCheck = await verifyFileExists(operation.targetFile)
    if (!fileCheck.exists) {
      return {
        allowed: false,
        reason: `File ${operation.targetFile} doesn't exist`,
        suggestion: fileCheck.suggestion
      }
    }
    checks.push({ name: 'file_exists', passed: true })
  }

  // 2. Function existence check (if modifying function)
  if (operation.targetFunction) {
    const funcCheck = await verifyFunctionExists(
      operation.targetFile,
      operation.targetFunction
    )
    if (!funcCheck.exists) {
      return {
        allowed: false,
        reason: `Function ${operation.targetFunction}() not found`,
        suggestion: funcCheck.suggestion,
        availableFunctions: funcCheck.allFunctions
      }
    }
    checks.push({ name: 'function_exists', passed: true })
  }

  // 3. Dependency check (if using external package)
  if (operation.requiredPackages) {
    for (const pkg of operation.requiredPackages) {
      const depCheck = await groundedDependencyCheck(pkg)
      if (!depCheck.installed) {
        return {
          allowed: false,
          reason: `Package ${pkg} not installed`,
          fix: `Run: npm install ${pkg}`
        }
      }
      checks.push({ name: `dependency_${pkg}`, passed: true })
    }
  }

  // 4. Git status check
  const gitStatus = await exec('git status --porcelain')
  if (gitStatus.includes(operation.targetFile)) {
    checks.push({
      name: 'uncommitted_changes',
      warning: `${operation.targetFile} has uncommitted changes - may cause conflicts`
    })
  }

  return {
    allowed: true,
    checks,
    warnings: checks.filter(c => c.warning)
  }
}
```

---

### Post-Execution Strategy

```javascript
// strategies/post-execution.js

/**
 * Run AFTER AI makes changes
 * Verify changes match what AI claimed
 */
export async function postExecutionValidation(operation, claim) {
  const validations = []

  // 1. Git diff validation
  const diff = await exec(`git diff ${operation.targetFile}`)

  if (!diff.trim()) {
    return {
      valid: false,
      hallucination: true,
      reason: 'AI claimed to make changes but git diff is empty',
      severity: 'high'
    }
  }

  validations.push({
    check: 'git_diff_exists',
    passed: true,
    diff: diff.substring(0, 500)  // First 500 chars
  })

  // 2. Test validation (if tests exist)
  const testFiles = await findTestFiles(operation.targetFile)
  if (testFiles.length > 0) {
    try {
      await exec('npm test')
      validations.push({ check: 'tests_pass', passed: true })
    } catch (error) {
      return {
        valid: false,
        reason: 'Changes broke tests',
        failedTests: extractTestFailures(error.message),
        severity: 'high'
      }
    }
  }

  // 3. Claim validation (the 67% problem check)
  const claimCheck = await validateClaim(claim, {
    file: operation.targetFile,
    diff
  })

  if (!claimCheck.valid) {
    return {
      valid: false,
      hallucination: claimCheck.hallucinationDetected,
      issues: claimCheck.issues,
      severity: claimCheck.issues[0]?.severity || 'medium'
    }
  }

  validations.push({ check: 'claim_matches_reality', passed: true })

  // 4. Syntax validation
  try {
    const code = await fs.readFile(operation.targetFile, 'utf8')
    parse(code)  // Babel parser
    validations.push({ check: 'syntax_valid', passed: true })
  } catch (syntaxError) {
    return {
      valid: false,
      reason: 'Changes introduced syntax errors',
      error: syntaxError.message,
      severity: 'high'
    }
  }

  return {
    valid: true,
    validations,
    summary: `All checks passed for ${operation.targetFile}`
  }
}
```

---

## Testing & Validation

### Hallucination Test Suite

```javascript
// tests/hallucination-detection.test.js

describe('Anti-Hallucination Framework', () => {

  test('Detects phantom file modifications', async () => {
    const claim = {
      type: 'file_modification',
      file: 'src/auth.js',
      description: 'Updated login function'
    }

    // Simulate: AI claims change but no git diff
    mockGitDiff('src/auth.js', '')

    const result = await validateClaim(claim)

    expect(result.valid).toBe(false)
    expect(result.hallucinationDetected).toBe(true)
    expect(result.issues[0].type).toBe('phantom_change')
  })

  test('Detects phantom function additions', async () => {
    const claim = {
      type: 'function_addition',
      file: 'src/utils.js',
      functionName: 'calculateTotal'
    }

    // File exists but function doesn't
    mockFileContent('src/utils.js', 'export function other() {}')

    const result = await validateClaim(claim)

    expect(result.valid).toBe(false)
    expect(result.issues[0].type).toBe('phantom_function')
  })

  test('Detects mismatched claims (67% problem)', async () => {
    const claim = {
      type: 'file_modification',
      file: 'src/api.js',
      description: 'Added error handling with try-catch'
    }

    // Git diff shows different change
    mockGitDiff('src/api.js', `
      + console.log('debug')
    `)

    const result = await validateClaim(claim)

    expect(result.valid).toBe(false)
    expect(result.issues[0].type).toBe('mismatched_claim')
  })

  test('Allows valid changes', async () => {
    const claim = {
      type: 'file_modification',
      file: 'src/auth.js',
      description: 'Added try-catch error handling'
    }

    mockGitDiff('src/auth.js', `
      + try {
      +   await authenticate()
      + } catch (error) {
      +   handleError(error)
      + }
    `)

    const result = await validateClaim(claim)

    expect(result.valid).toBe(true)
    expect(result.hallucinationDetected).toBe(false)
  })
})
```

---

## Human-in-the-Loop Safeguards

### When to Escalate to Human Review

**Source:** [Red Hat: When LLMs Daydream](https://www.redhat.com/en/blog/when-llms-day-dream-hallucinations-how-prevent-them)

> Having a human being validate and review AI outputs is a final backstop measure to prevent hallucination, ensuring that if the AI hallucinates, a human will be available to filter and correct it.

**SoulAI Escalation Triggers:**

```javascript
// guardrails/human-review-trigger.js

const ESCALATION_RULES = {

  // High-risk operations always need approval
  destructive: [
    'rm -rf',
    'DROP TABLE',
    'git reset --hard',
    'npm uninstall'
  ],

  // Hallucination indicators
  hallucination_signals: {
    phantom_file: true,           // Claimed file doesn't exist
    phantom_function: true,        // Claimed function doesn't exist
    no_git_diff: true,            // Claimed change but no diff
    test_failures: true,          // Changes broke tests
    claim_mismatch: true          // 67% problem detected
  },

  // Uncertainty indicators
  low_confidence: {
    threshold: 0.7,               // Confidence < 70%
    inconsistent_outputs: true,   // Best-of-N diverged
    syntax_errors: true           // Introduced parse errors
  }
}

export function shouldEscalateToHuman(operation, validationResult) {
  // 1. Destructive operations
  if (ESCALATION_RULES.destructive.some(cmd =>
      operation.command?.includes(cmd)
  )) {
    return {
      escalate: true,
      reason: 'Destructive operation requires human approval',
      severity: 'critical'
    }
  }

  // 2. Hallucination detected
  if (validationResult.hallucinationDetected) {
    return {
      escalate: true,
      reason: 'Possible hallucination detected',
      details: validationResult.issues,
      severity: 'high'
    }
  }

  // 3. Low confidence
  if (validationResult.confidence < ESCALATION_RULES.low_confidence.threshold) {
    return {
      escalate: true,
      reason: `Low confidence (${validationResult.confidence})`,
      severity: 'medium'
    }
  }

  // 4. Test failures
  if (validationResult.testsFailed) {
    return {
      escalate: true,
      reason: 'Changes broke existing tests',
      failedTests: validationResult.failedTests,
      severity: 'high'
    }
  }

  return { escalate: false }
}
```

### Human Review Interface

```javascript
// guardrails/human-review-interface.js

export async function requestHumanReview(operation, issue) {
  console.log('\n⚠️  HUMAN REVIEW REQUIRED ⚠️\n')
  console.log(`Reason: ${issue.reason}`)
  console.log(`Severity: ${issue.severity}\n`)

  if (issue.details) {
    console.log('Details:')
    issue.details.forEach(d => {
      console.log(`  - ${d.message}`)
    })
  }

  console.log('\nOperation:')
  console.log(JSON.stringify(operation, null, 2))

  const answer = await prompt({
    type: 'select',
    name: 'decision',
    message: 'How should we proceed?',
    choices: [
      { title: 'Approve (proceed with operation)', value: 'approve' },
      { title: 'Reject (cancel operation)', value: 'reject' },
      { title: 'Fix (let me correct the operation)', value: 'fix' },
      { title: 'Investigate (run diagnostics)', value: 'investigate' }
    ]
  })

  return answer.decision
}
```

---

## Configuration

**~/.soulai/config.json**

```json
{
  "verification": {
    "enabled": true,
    "strictMode": true,

    "preExecution": {
      "checkFileExists": true,
      "checkFunctionExists": true,
      "checkDependencies": true,
      "checkGitStatus": true
    },

    "postExecution": {
      "validateGitDiff": true,
      "runTests": true,
      "validateClaims": true,
      "checkSyntax": true
    },

    "hallucination": {
      "detectPhantomFiles": true,
      "detectPhantomFunctions": true,
      "detectMismatchedClaims": true,
      "useBestOfN": false,
      "nSamples": 3
    },

    "grounding": {
      "useRAG": true,
      "groundInFilesystem": true,
      "groundInGit": true,
      "groundInDependencies": true,
      "extractQuotesFirst": true
    },

    "humanReview": {
      "enabled": true,
      "escalateOnHallucination": true,
      "escalateOnLowConfidence": true,
      "confidenceThreshold": 0.7,
      "escalateDestructiveOps": true
    },

    "logging": {
      "logHallucinations": true,
      "logPath": "~/.soulai/logs/hallucinations.log",
      "logLevel": "info"
    },

    "temperature": {
      "fileOperations": 0.2,
      "codeGeneration": 0.4,
      "brainstorming": 0.8
    }
  }
}
```

---

## Summary: SoulAI's 5-Layer Defense

```
Layer 1: RAG (Retrieval-Augmented Generation)
  ↓ Ground responses in real files/code before claiming

Layer 2: Pre-Execution Grounding
  ↓ Verify files/functions exist before operations

Layer 3: Post-Execution Verification
  ↓ Validate git diff matches claims

Layer 4: Claim Validation (67% Problem Solver)
  ↓ Cross-check AI's description with actual changes

Layer 5: Human Review (Final Backstop)
  ↓ Escalate on hallucination, low confidence, or destructive ops
```

**Result:** Minimize hallucinations through **grounding → verification → validation → human oversight**.

---

## Sources

- [Wikipedia: Signs of AI Writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- [Wiki Education: Generative AI and Wikipedia Editing (2025)](https://wikiedu.org/blog/2026/01/29/generative-ai-and-wikipedia-editing-what-we-learned-in-2025/)
- [Wikipedia: AI Detection is Not a Content Policy](https://en.wikipedia.org/wiki/Wikipedia:AI_detection_is_not_a_content_policy)
- [Anthropic Claude: Reduce Hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)
- [You.com: AI Hallucination Prevention Guide](https://you.com/resources/ai-hallucination-prevention-guide)
- [Microsoft: Best Practices for Mitigating Hallucinations in LLMs](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/best-practices-for-mitigating-hallucinations-in-large-language-models-llms/4403129)
- [K2View: What is Grounding and Hallucinations in AI](https://www.k2view.com/blog/what-is-grounding-and-hallucinations-in-ai/)
- [Red Hat: When LLMs Daydream - Hallucinations and How to Prevent Them](https://www.redhat.com/en/blog/when-llms-day-dream-hallucinations-how-prevent-them)
- [ADA: The Ultimate Guide to Generative AI Hallucinations](https://www.ada.cx/blog/the-ultimate-guide-to-understanding-and-mitigating-generative-ai-hallucinations/)
- [IBM: What Are AI Hallucinations?](https://www.ibm.com/think/topics/ai-hallucinations)

---

**Version History:**
- v1.0 (2026-04-01): Initial framework based on Wikipedia research + modern hallucination prevention techniques
