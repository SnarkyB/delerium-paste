# Automated Security Scanning

This document describes the automated security scanning setup for Delirium.

## Overview

Automated security scanning runs vulnerability checks on both frontend (npm) and backend (Gradle/Kotlin) dependencies to identify known security vulnerabilities.

## Components

### 1. Frontend Security Scanning (npm audit)

- **Tool:** npm audit
- **Trigger:** On every PR, push to main, and scheduled daily
- **Severity Threshold:** Moderate and above
- **Action:** Fails build if Critical or High vulnerabilities found

### 2. Backend Security Scanning (OWASP Dependency Check)

- **Tool:** OWASP Dependency Check plugin for Gradle
- **Trigger:** On every PR, push to main, and scheduled daily
- **CVSS Threshold:** Fails build on CVSS >= 7.0 (High/Critical)
- **Reports:** HTML, JSON, XML formats in `server/build/reports/dependency-check/`

### 3. GitHub Actions Workflows

#### PR Checks Workflow (`.github/workflows/pr-checks.yml`)

- Runs security scans as part of PR quality gates
- Blocks PRs with Critical or High vulnerabilities

#### Security Scan Workflow (`.github/workflows/security-scan.yml`)

- Dedicated security scanning workflow
- Runs on:
  - Push to main (when dependencies change)
  - Pull requests
  - New tags/releases
  - Scheduled daily at 2 AM UTC
  - Manual trigger (workflow_dispatch)
- Uploads scan reports as artifacts (retained for 30 days)

## Local Usage

### Run Security Scan Locally

```bash
# Using Makefile
make security-scan

# Or directly
./scripts/security-scan.sh
```

### Frontend Only

```bash
cd client
npm audit --audit-level=moderate
```

### Backend Only

```bash
cd server
./gradlew dependencyCheckAnalyze
```

## Configuration

### Frontend (npm)

No additional configuration needed. Uses npm's built-in audit database.

### Backend (OWASP Dependency Check)

Configuration in `server/build.gradle.kts`:

```kotlin
dependencyCheck {
    format = "ALL"
    outputDirectory = "build/reports/dependency-check"
    suppressionFile = "dependency-check-suppressions.xml"
    failBuildOnCVSS = 7.0f  // Fail build on CVSS >= 7.0
    analyzers {
        assemblyEnabled = false
        nuspecEnabled = false
        nodeEnabled = false
    }
}
```

### Suppressing False Positives

To suppress false positives or accepted risks, edit `server/dependency-check-suppressions.xml`:

```xml
<suppress>
    <notes><![CDATA[
    False positive - library is used in a safe context
    ]]></notes>
    <packageUrl regex="true">^pkg:maven/.*$</packageUrl>
    <cve>CVE-2024-XXXXX</cve>
</suppress>
```

## Reports

### Frontend Reports

- **Location:** `client/npm-audit-report.json`
- **Format:** JSON
- **View:** `npm audit` command or JSON viewer

### Backend Reports

- **Location:** `server/build/reports/dependency-check/`
- **Formats:** HTML, JSON, XML
- **View:** Open `dependency-check-report.html` in browser

### GitHub Actions Artifacts

Reports are uploaded as artifacts in GitHub Actions:

- `npm-audit-report` - Frontend scan results
- `owasp-dependency-check-report` - Backend scan results
- Retained for 30 days

## Scheduled Scans

Security scans run automatically:

- **Daily:** 2 AM UTC (via scheduled workflow)
- **On PRs:** Every pull request
- **On Releases:** When tags are created
- **On Dependency Changes:** When package files are modified

## Handling Vulnerabilities

### Critical/High Severity

1. **Immediate Action Required**
   - Review the vulnerability details
   - Check if update is available
   - Update dependency if possible
   - If update not available, add suppression with justification

2. **Update Dependencies**

```bash
# Frontend
cd client
npm update <package-name>
npm audit fix  # Auto-fix vulnerabilities where possible

# Backend
cd server
# Update version in build.gradle.kts
./gradlew dependencyCheckUpdate  # Update CVE database
./gradlew dependencyCheckAnalyze  # Re-run scan
```

### Moderate/Low Severity

- Review and assess risk
- Update when convenient
- Document decision if not updating

## Best Practices

1. **Regular Updates:** Keep dependencies up to date
2. **Review Reports:** Regularly review scan reports
3. **Document Suppressions:** Always document why vulnerabilities are suppressed
4. **Monitor Advisories:** Subscribe to security advisories for key dependencies
5. **Automated Updates:** Consider using Dependabot or Renovate for automated PRs

## Troubleshooting

### OWASP Dependency Check Takes Too Long

First run downloads CVE database (~500MB). Subsequent runs are faster due to caching.

```bash
# Update CVE database manually
cd server
./gradlew dependencyCheckUpdate
```

### False Positives

Add suppressions to `server/dependency-check-suppressions.xml` with proper justification.

### npm audit Shows Old Vulnerabilities

```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm audit
```

## Integration with CI/CD

Security scans are integrated into:

- ✅ PR quality gates (blocks PRs with Critical/High vulnerabilities)
- ✅ Release process (scans on tag creation)
- ✅ Daily automated scans
- ✅ Manual trigger via GitHub Actions UI

## Related Documentation

- [Security Checklist](CHECKLIST.md)
- [Security Check Script](scripts/security-check.sh)

**Note**: This document previously linked to a VULNERABILITY_SCAN_REPORT.md file, but vulnerability scans should be run regularly and results are time-sensitive. Use the automated scanning tools described in this guide instead.
