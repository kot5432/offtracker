# Cargo Permission Error Resolution Plan

## Problem Analysis

**Current Error:**
```
error: failed to create directory `C:\Users\kkyog\.cargo\registry\cache\index.crates.io-1949cf8c6b5b557f`
Caused by:
    アクセスが拒否されました。 (os error 5)
```

**Root Causes (Based on Research):**
1. **Windows Defender blocking** - Most common cause on Windows
2. **Hidden folder attribute** - `.cargo` folder marked as hidden
3. **Folder permissions** - Incorrect security permissions
4. **Antivirus interference** - Third-party antivirus software
5. **Environment variable conflicts** - Manual environment variable setup

## Resolution Strategy

### Phase 1: Windows Defender Exclusions (Primary Solution)

**Steps:**
1. Open Windows Security
2. Navigate to Virus & Threat Protection
3. Manage settings → Exclusions
4. Add these folders to exclusions:
   - `C:\Users\kkyog\.cargo`
   - `C:\Users\kkyog\.rustup`
   - `C:\Users\kkyog\cousor\offtracker\desktop\src-tauri\target`
   - `C:\Users\kkyog\cousor\offtracker`

**Expected Outcome:** Cargo can access cache directories without Defender interference

### Phase 2: Folder Permission Check

**Steps:**
1. Right-click `.cargo` folder → Properties → Security
2. Check user permissions (read/write should be enabled)
3. If permissions are missing, add user with full control
4. Repeat for `.rustup` folder

**Expected Outcome:** User has proper read/write access to Cargo directories

### Phase 3: Hidden Attribute Removal

**Steps:**
1. Check if `.cargo` folder is hidden
2. If hidden, unhide using:
   - Properties → General → Uncheck "Hidden"
   - Or use PowerShell: `Get-Item .cargo | ForEach-Object { $_.Attributes = $_.Attributes -bor [System.IO.FileAttributes]::Hidden }`
3. Apply recursively to subdirectories

**Expected Outcome:** Folder attributes don't interfere with file operations

### Phase 4: Environment Variable Verification

**Steps:**
1. Check for manual Cargo environment variables
2. Remove any manual `CARGO_HOME` or similar variables
3. Let rustup manage environment variables automatically
4. Restart terminal after changes

**Expected Outcome:** Cargo uses correct paths without conflicts

### Phase 5: Alternative Cargo Configuration

**If above steps fail:**

**Option A: Change Cargo Home Directory**
```powershell
# Set CARGO_HOME to a different location
$env:CARGO_HOME = "C:\Users\kkyog\cargo-home"
# Add to system environment variables
```

**Option B: Use cargo-config for path overrides**
```toml
# ~/.cargo/config.toml
[build]
target-dir = "C:/Users/kkyog/cargo-target"
```

**Option C: Clean cargo cache completely**
```powershell
# Remove cache and registry
Remove-Item -Recurse -Force ~/.cargo/registry
Remove-Item -Recurse -Force ~/.cargo/git
# Rebuild cache
cargo update
```

## Implementation Plan

### Step 1: User Manual Actions (Requires User Input)

**User Actions Required:**
1. Open Windows Security → Virus & Threat Protection → Manage settings → Exclusions
2. Add the 4 folders listed in Phase 1
3. Check folder permissions for `.cargo` and `.rustup`
4. Unhide `.cargo` folder if hidden
5. Check environment variables for manual Cargo settings

### Step 2: Automated Verification

**Verification Commands:**
```powershell
# Check folder permissions
Get-Acl C:\Users\kkyog\.cargo | Format-List

# Check folder attributes
Get-Item C:\Users\kkyog\.cargo | Select-Object Attributes

# Check environment variables
Get-ChildItem Env: | Where-Object {$_.Name -like "*CARGO*"}

# Test cargo basic operation
cargo --version
```

### Step 3: Tauri Build Test

**After manual fixes:**
```powershell
cd C:\Users\kkyog\cousor\offtracker\desktop\src-tauri
cargo build
```

### Step 4: Alternative Approaches (If manual fixes fail)

**Option A: PowerShell Administrator**
```powershell
# Run as administrator
Add-MpPreference -ExclusionPath "C:\Users\kkyog\.cargo"
Add-MpPreference -ExclusionPath "C:\Users\kkyog\.rustup"
Add-MpPreference -ExclusionPath "C:\Users\kkyog\cousor\offtracker"
```

**Option B: Different Cargo Location**
```powershell
# Create new cargo home
New-Item -ItemType Directory -Path "C:\Users\kkyog\cargo-home" -Force
$env:CARGO_HOME = "C:\Users\kkyog\cargo-home"
```

## Risk Assessment

**Low Risk:**
- Windows Defender exclusions (standard development practice)
- Folder permission checks
- Hidden attribute removal

**Medium Risk:**
- Environment variable changes (requires careful testing)
- Alternative cargo home location (may affect other projects)

**High Risk:**
- System-wide Defender changes (may need admin approval)
- Complete cargo cache deletion (rebuild time)

## Success Criteria

**Immediate Success:**
- `cargo build` completes without permission errors
- Tauri project builds successfully
- Desktop application runs with Web UI

**Secondary Success:**
- Build times are reasonable (< 5 minutes)
- No Defender warnings during build
- Cargo cache works properly for future builds

## Timeline

**Manual User Actions:** 15-30 minutes
**Automated Verification:** 5 minutes
**Build Testing:** 10-20 minutes
**Total Estimated Time:** 30-65 minutes

## Fallback Plan

**If manual fixes don't work:**
1. Try PowerShell administrator approach
2. Implement alternative cargo home location
3. Consider using cloud development environment
4. Fall back to alternative Electron implementation

## Documentation

**After resolution:**
1. Document the exact fix that worked
2. Update PROGRESS_UPDATE.md with solution
3. Add setup instructions for future reference
4. Document Windows Defender exclusion pattern for team