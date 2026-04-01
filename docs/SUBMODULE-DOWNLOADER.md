# Submodule Downloader

Automatic git submodule downloader for SoulAI skills.

## Overview

SoulAI uses git submodules to include powerful skill collections from various sources. The Submodule Downloader ensures that all required submodules are automatically downloaded when you run `soulai init` or manually updated with `soulai update`.

## Features

- [OK] **Auto-download**: Automatically downloads missing submodules during `soulai init`
- [OK] **Smart caching**: Skips already downloaded submodules
- [OK] **Update support**: Updates existing submodules with `soulai update`
- [OK] **Progress tracking**: Shows download/update progress with clear status messages
- [OK] **Error handling**: Graceful error handling with retry logic
- [OK] **Status checking**: View submodule status and skill counts

## Included Submodules

SoulAI includes 4 submodules with 161+ skills:

| Submodule | Repository | Skills |
|-----------|-----------|--------|
| superpowers | https://github.com/obra/superpowers | 14 |
| everything-claude-code | https://github.com/ProfSynapse/everything-claude-code | 147 |
| ui-ux-pro-max-skill | https://github.com/ProfSynapse/ui-ux-pro-max-skill | TBD |
| claude-mem | https://github.com/ProfSynapse/claude-mem | TBD |

## Usage

### Automatic Download (Recommended)

Submodules are automatically downloaded when you run:

```bash
soulai init
```

The init process will:
1. Check for existing submodules
2. Download any missing submodules
3. Scan all skills
4. Generate skill.md for your project

### Manual Update

To update existing submodules to the latest version:

```bash
soulai update
```

This will:
1. Check current submodule status
2. Pull latest changes from each submodule
3. Display final skill counts

### Check Status

To view submodule status without updating:

```bash
node -e "import('./orchestrator/submodule-downloader.js').then(m => {
  const d = new m.SubmoduleDownloader('.');
  console.log(d.getStatus());
})"
```

## Architecture

### Class: SubmoduleDownloader

```javascript
import { SubmoduleDownloader } from './orchestrator/submodule-downloader.js';

const downloader = new SubmoduleDownloader('/path/to/soulai');
```

#### Methods

**`isGitAvailable()`**
- Returns: `boolean`
- Checks if git is available in PATH

**`submoduleExists(name)`**
- Parameters: `name` - submodule name
- Returns: `boolean`
- Checks if a submodule exists and has files

**`downloadSubmodule(name, url)`**
- Parameters:
  - `name` - submodule name
  - `url` - git repository URL
- Returns: `{ success: boolean, cached?: boolean, error?: string }`
- Downloads a single submodule

**`downloadAll()`**
- Returns: `{ success: boolean, results: Object, summary: Object }`
- Downloads all submodules

**`updateAll()`**
- Returns: `{ success: boolean, results: Object }`
- Updates all existing submodules

**`getStatus()`**
- Returns: `Object` - Status of all submodules with skill counts

## Implementation Details

### Download Strategy

1. **Check git availability**: Ensures git is installed
2. **Check existing submodules**: Skips already downloaded submodules
3. **Shallow clone**: Uses `--depth 1` for faster downloads
4. **Silent mode**: Uses `--quiet` to reduce output noise
5. **Error recovery**: Continues downloading other submodules on failure

### Directory Structure

```
soulai/
├── submodules/
│   ├── superpowers/
│   │   └── skills/
│   │       ├── systematic-debugging/
│   │       │   └── SKILL.md
│   │       ├── test-driven-development/
│   │       │   └── SKILL.md
│   │       └── ...
│   ├── everything-claude-code/
│   │   └── skills/
│   │       └── ...
│   ├── ui-ux-pro-max-skill/
│   │   └── skills/
│   │       └── ...
│   └── claude-mem/
│       └── skills/
│           └── ...
```

### Integration Points

1. **init-skill.js**: Calls `downloadAll()` before scanning skills
2. **update-submodules.js**: Standalone script for manual updates
3. **skill-scanner.js**: Scans downloaded submodules for skills
4. **skill-generator.js**: Generates skill.md from scanned skills

## Testing

Run tests with:

```bash
npm test tests/unit/submodule-downloader.test.js
```

Test coverage:
- [OK] Constructor initialization
- [OK] Git availability check
- [OK] Submodule existence check
- [OK] Single submodule download
- [OK] Bulk download
- [OK] Status checking
- [OK] Error handling

## Troubleshooting

### Git not found

```
[ERROR] Git is not installed or not available in PATH
```

**Solution**: Install git from https://git-scm.com/downloads

### Network errors

```
[ERROR] Failed to download 'submodule-name': Network error
```

**Solution**:
- Check internet connection
- Verify repository URL is accessible
- Try again later

### Empty skills count

```
[OK] superpowers: 0 skills
```

**Solution**:
- Run `soulai update` to update submodules
- Check if skills directory exists in submodule
- Verify submodule has correct structure

## Contributing

When adding new submodules:

1. Update `SUBMODULES` constant in `submodule-downloader.js`
2. Update this documentation
3. Add tests for new submodule
4. Run `npm test` to verify

## License

MIT License - See LICENSE file for details
