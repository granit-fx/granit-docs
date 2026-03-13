---
title: CI/CD
description: GitLab CI pipeline for building, testing, and publishing Granit packages
sidebar:
  order: 4
---

This guide covers the CI/CD pipeline for the Granit framework: compilation,
quality gates, security scanning, static analysis, NuGet packaging, and
publication to the GitLab Package Registry.

## Pipeline overview

The pipeline runs on every merge request, push to `develop`/`main`, and
release tag (`vX.Y.Z`):

| Stage | Jobs | Blocking |
| --- | --- | --- |
| 1. build | `build` | Yes |
| 2. quality | `format`, `test`, `integration-test` | `format` and `test`: yes. `integration-test`: no |
| 3. gitlab-security | `secret_detection`, `semgrep-sast`, `sast` | `secret_detection` and `semgrep-sast`: yes |
| 4. analysis | `sonarqube`, `audit:nuget` | No (advisory) |
| 5. docs | `docfx` | No |
| 6. pack | `pack` | Yes |
| 7. publish | `publish` | Yes |
| 8. deploy | `pages` | No (main only) |

## Build commands

These are the core commands used in CI and available for local development:

```bash
# Compile the solution
dotnet build

# Run all unit tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Verify code formatting (fails if changes needed)
dotnet format --verify-no-changes

# Create NuGet packages
dotnet pack -c Release -o ./nupkgs
```

## Stage details

### build

Compiles the full solution. Integration tests are excluded from compilation
at this stage (`-p:SkipIntegrationTests=true`) to avoid requiring Docker.

### quality

Three jobs run in parallel:

**format** -- Runs `dotnet format --verify-no-changes` to enforce consistent code
style. This is a hard gate: merge requests with formatting violations are blocked.

**test** -- Runs unit tests with OpenCover and Cobertura coverage output.
Coverage reports are uploaded as artifacts for SonarQube consumption.

**integration-test** -- Uses [Testcontainers](https://dotnet.testcontainers.org/)
to spin up PostgreSQL containers and validate tenant isolation (ISO 27001
requirement). This job uses the Docker socket mounted natively on the runner --
no Docker-in-Docker required. Marked `allow_failure` because it depends on
Docker availability.

### gitlab-security

GitLab-native security scans:

| Job | Tool | Purpose |
| --- | --- | --- |
| `secret_detection` | GitLab Secret Detection | Detects committed secrets (API keys, passwords) |
| `semgrep-sast` | Semgrep | Static analysis for security vulnerabilities |
| `sast` | GitLab SAST | Additional static analysis (non-blocking) |

### analysis

**sonarqube** -- Static analysis with code coverage integration. Receives
OpenCover reports from the `test` job. Requires `SONAR_HOST_URL` and
`SONAR_TOKEN` CI variables.

**audit:nuget** -- Runs `dotnet list package --vulnerable` and fails if any
HIGH or CRITICAL vulnerability is found. The vulnerability report is saved
as a job artifact.

### pack

Creates NuGet packages with automatic versioning:

| Context | Version format |
| --- | --- |
| Release tag `vX.Y.Z` | `X.Y.Z` (stable release) |
| Branch `develop`/`main` | `0.1.0-dev.<pipeline_iid>` (prerelease) |

### publish

Pushes `.nupkg` files to the GitLab Package Registry using the `CI_JOB_TOKEN`.
No additional CI variables are required for authentication.

## NuGet cache strategy

The `bin/obj` directories across 93 packages exceed 500 MB, making artifact
sharing impractical. Each job compiles independently but shares the NuGet
package cache, keyed by `Directory.Packages.props`. Restore completes in
5-10 seconds with a warm cache.

## CI variables

### Required

None. The pipeline uses the native `CI_JOB_TOKEN` for GitLab API operations.

### Optional

| Variable | Description | Masked |
| --- | --- | --- |
| `SONAR_HOST_URL` | SonarQube server URL | No |
| `SONAR_TOKEN` | SonarQube authentication token | Yes |

## Consuming Granit packages

Applications that depend on Granit add the GitLab Package Registry as a
NuGet source:

```xml
<!-- nuget.config -->
<packageSources>
  <add key="gitlab-granit"
       value="https://gitlab.example.com/api/v4/projects/6/packages/nuget/index.json" />
</packageSources>
<packageSourceMapping>
  <packageSource key="gitlab-granit">
    <package pattern="Granit.*" />
  </packageSource>
</packageSourceMapping>
```

Authentication uses `CI_JOB_TOKEN` in CI environments. For local development,
configure credentials in `packageSourceCredentials`.

## Definition of Done

Before any merge request is approved, the following gates must pass:

- [ ] `dotnet build` succeeds
- [ ] `dotnet test` passes with adequate coverage
- [ ] `dotnet format --verify-no-changes` passes
- [ ] No HIGH/CRITICAL NuGet vulnerabilities
- [ ] Secret detection scan clean
- [ ] Documentation updated (if applicable)

:::caution[Blocking gates]
Tests passing, format clean, and documentation updated are **blocking** requirements.
Do not merge without satisfying all gates. See the full
[Definition of Done](/granit-dotnet/guides/conventions/) for details.
:::

## Troubleshooting

### Test job times out

Increase test runner timeouts:

```yaml
variables:
  VSTEST_CONNECTION_TIMEOUT: "300"
  XUNIT_LAUNCH_TIMEOUT: "300"
```

### SonarQube shows 0% coverage

Verify that:

1. The `test` job produces `**/coverage.opencover.xml` artifacts.
2. The `sonarqube` job has `needs: [test]` with `artifacts: true`.
3. `sonar.cs.opencover.reportsPaths` points to `**/coverage.opencover.xml`.

### audit:nuget fails

A NuGet dependency has a known HIGH or CRITICAL vulnerability. Check the
`vulnerability-report.txt` artifact for details. Update the affected package
or, if a fix is not available, document the risk assessment and mark the
advisory as accepted.

### Integration tests fail with connection errors

Verify that:

1. `DOCKER_HOST` is set correctly for the CI runner.
2. `TESTCONTAINERS_HOST_OVERRIDE` matches the Docker host.
3. The test fixture implements `ApplyHostOverride()` for Docker bridge fallback.
