param(
  [string]$ProjectConfigPath = '.vercel/project.json'
)

$projectConfig = Get-Content $ProjectConfigPath -Raw | ConvertFrom-Json
$projectId = $projectConfig.projectId
$teamId = $projectConfig.orgId

$authPath = Join-Path $env:APPDATA 'com.vercel.cli\Data\auth.json'
$auth = Get-Content $authPath -Raw | ConvertFrom-Json
$token = $auth.token

$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'
$envMap = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
    return
  }

  $parts = $_ -split '=', 2
  if ($parts.Length -eq 2) {
    $envMap[$parts[0].Trim()] = $parts[1]
  }
}

function Upsert-VercelEnv {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][string]$Value,
    [switch]$Sensitive
  )

  $headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  }

  $payload = @{
    key = $Name
    value = $Value
    target = @($Target)
    type = $(if ($Sensitive) { 'sensitive' } else { 'plain' })
  }

  $uri = "https://api.vercel.com/v10/projects/$projectId/env?upsert=true&teamId=$teamId"
  Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body ($payload | ConvertTo-Json -Depth 5) | Out-Null
  Write-Output ("SYNCED {0} [{1}]" -f $Name, $Target)
}

$previewVars = [ordered]@{
  'VITE_APP_ENV' = 'staging'
  'VITE_API_BASE_URL' = '/api/v1'
  'VITE_API_TIMEOUT_MS' = '65000'
  'VITE_BASE_PATH' = '/'
  'VITE_FIREBASE_API_KEY' = $envMap['VITE_FIREBASE_API_KEY']
  'VITE_FIREBASE_AUTH_DOMAIN' = $envMap['VITE_FIREBASE_AUTH_DOMAIN']
  'VITE_FIREBASE_PROJECT_ID' = $envMap['VITE_FIREBASE_PROJECT_ID']
  'VITE_FIREBASE_STORAGE_BUCKET' = $envMap['VITE_FIREBASE_STORAGE_BUCKET']
  'VITE_FIREBASE_MESSAGING_SENDER_ID' = $envMap['VITE_FIREBASE_MESSAGING_SENDER_ID']
  'VITE_FIREBASE_APP_ID' = $envMap['VITE_FIREBASE_APP_ID']
  'VITE_FIREBASE_MEASUREMENT_ID' = $envMap['VITE_FIREBASE_MEASUREMENT_ID']
  'GEMINI_API_KEY' = $envMap['GEMINI_API_KEY']
  'GEMINI_CHAT_MODEL' = $envMap['GEMINI_CHAT_MODEL']
  'GEMINI_INSIGHTS_MODEL' = $envMap['GEMINI_INSIGHTS_MODEL']
  'API_PREFIX' = '/api/v1'
  'RATE_LIMIT_WINDOW_MS' = '60000'
  'RATE_LIMIT_MAX' = '60'
  'LOG_LEVEL' = 'info'
}

$productionVars = [ordered]@{
  'VITE_APP_ENV' = 'prod'
  'VITE_API_BASE_URL' = '/api/v1'
  'VITE_API_TIMEOUT_MS' = '65000'
  'VITE_BASE_PATH' = '/'
  'VITE_FIREBASE_API_KEY' = $envMap['VITE_FIREBASE_API_KEY']
  'VITE_FIREBASE_AUTH_DOMAIN' = $envMap['VITE_FIREBASE_AUTH_DOMAIN']
  'VITE_FIREBASE_PROJECT_ID' = $envMap['VITE_FIREBASE_PROJECT_ID']
  'VITE_FIREBASE_STORAGE_BUCKET' = $envMap['VITE_FIREBASE_STORAGE_BUCKET']
  'VITE_FIREBASE_MESSAGING_SENDER_ID' = $envMap['VITE_FIREBASE_MESSAGING_SENDER_ID']
  'VITE_FIREBASE_APP_ID' = $envMap['VITE_FIREBASE_APP_ID']
  'VITE_FIREBASE_MEASUREMENT_ID' = $envMap['VITE_FIREBASE_MEASUREMENT_ID']
  'GEMINI_API_KEY' = $envMap['GEMINI_API_KEY']
  'GEMINI_CHAT_MODEL' = $envMap['GEMINI_CHAT_MODEL']
  'GEMINI_INSIGHTS_MODEL' = $envMap['GEMINI_INSIGHTS_MODEL']
  'API_PREFIX' = '/api/v1'
  'RATE_LIMIT_WINDOW_MS' = '60000'
  'RATE_LIMIT_MAX' = '100'
  'LOG_LEVEL' = 'info'
}

foreach ($entry in $previewVars.GetEnumerator()) {
  if (-not [string]::IsNullOrWhiteSpace($entry.Value)) {
    Upsert-VercelEnv -Name $entry.Key -Target 'preview' -Value $entry.Value -Sensitive:($entry.Key -eq 'GEMINI_API_KEY')
  }
}

foreach ($entry in $productionVars.GetEnumerator()) {
  if (-not [string]::IsNullOrWhiteSpace($entry.Value)) {
    Upsert-VercelEnv -Name $entry.Key -Target 'production' -Value $entry.Value -Sensitive:($entry.Key -eq 'GEMINI_API_KEY')
  }
}

Write-Output 'VERCEL_ENV_SYNC_DONE'
