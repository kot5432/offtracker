param(
    [string]$ModelName = "@cf/qwen/qwen3-30b-a3b-fp8",
    [string]$CasesPath = "docs/mock-sessions/purpose-classification-rubric-v2-cases.json",
    [int]$MaxCases = 0,
    [string]$ResumeFrom = ""
)

$credentialPath = Join-Path (Get-Location) ".cloudflare-credentials.json"
if (-not (Test-Path -LiteralPath $credentialPath -PathType Leaf)) {
    throw "Credential file not found: $credentialPath. Create it with accountId and apiToken fields."
}

$credentials = Get-Content -LiteralPath $credentialPath -Raw | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($credentials.accountId) -or [string]::IsNullOrWhiteSpace($credentials.apiToken)) {
    throw "Credential file must contain non-empty accountId and apiToken fields."
}

$evaluationExitCode = 0

try {
    $env:CLOUDFLARE_ACCOUNT_ID = $credentials.accountId
    $env:CLOUDFLARE_API_TOKEN = $credentials.apiToken
    if (-not [string]::IsNullOrWhiteSpace($ResumeFrom)) {
        node scripts/evaluate-purpose-classification-cloudflare.mjs $ModelName $CasesPath $MaxCases $ResumeFrom
    } elseif ($MaxCases -gt 0) {
        node scripts/evaluate-purpose-classification-cloudflare.mjs $ModelName $CasesPath $MaxCases
    } else {
        node scripts/evaluate-purpose-classification-cloudflare.mjs $ModelName $CasesPath
    }
    $evaluationExitCode = $LASTEXITCODE
}
finally {
    Remove-Item Env:CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
    Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
    if ($credentials -is [System.IDisposable]) { $credentials.Dispose() }
}

if ($evaluationExitCode -ne 0) {
    throw "Cloudflare model evaluation failed with exit code $evaluationExitCode."
}
