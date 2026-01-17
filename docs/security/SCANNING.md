# Automated Security Scanning

This document describes the automated security scanning setup for Delirium.

## Overview

Automated security scanning runs vulnerability checks on both frontend (npm) and backend (Bazel/Kotlin) dependencies to identify known security vulnerabilities.

## Components

### 1. Frontend Security Scanning (npm audit)

- **Tool:** npm audit
- **Trigger:** On every PR, push to main, and scheduled daily
- **Severity Threshold:** Moderate and above
- **Action:** Fails build if Critical or High vulnerabilities found

### 2. Backend Security Scanning (GitHub Dependabot)

- **Tool:** GitHub Dependabot (automatic dependency scanning)
- **Trigger:** On every PR, push to main, and scheduled daily
- **CVSS Threshold:** Alerts on High/Critical vulnerabilities
- **Reports:** Available in GitHub Security tab

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
# Backend dependencies are managed via Bazel and scanned automatically by GitHub Dependabot
# Check the GitHub Security tab for vulnerability reports
bazel query 'deps(//server:delerium_server_lib)' --output=package
```

## Configuration

### Frontend (npm)

No additional configuration needed. Uses npm's built-in audit database.

### Backend (GitHub Dependabot)

Backend dependencies are managed in `MODULE.bazel` and automatically scanned by GitHub Dependabot. Dependencies are defined as Maven artifacts:

```python
maven.install(
    artifacts = [
        "io.ktor:ktor-server-core-jvm:3.0.2",
        # ... other dependencies
    ],
    repositories = [
        "https://repo1.maven.org/maven2",
    ],
)
```

Vulnerability reports are available in the GitHub Security tab.

### Suppressing False Positives

To suppress false positives or accepted risks in GitHub Dependabot, use the "Dismiss" option in the Security tab with a justification:

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

- **Location:** GitHub Security tab
- **Format:** Web interface with detailed vulnerability information
- **View:** Navigate to repository → Security → Dependabot alerts

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
# Update version in MODULE.bazel
# Then rebuild to verify
bazel build //server:delerium_server_deploy
# Check GitHub Security tab for updated vulnerability reports
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
# Dependabot automatically updates vulnerability database
# Check GitHub Security tab for latest reports
cd server
bazel query 'deps(//server:delerium_server_lib)' --output=package
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
