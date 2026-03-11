param(
  [Parameter(Mandatory = $true)][string]$DeploymentUrl
)

$payload = @{
  installationId = 'vercel-qa'
  language = 'ko'
  message = 'Tell me my fortune today'
  profile = @{
    id = 'vercel-profile'
    name = 'QA'
  }
  saju = @{
    year = 'Gapja'
    month = 'Eulchuk'
    day = 'Byeongin'
    hour = 'Jeongmyo'
  }
} | ConvertTo-Json -Depth 6 -Compress

$tmp = [System.IO.Path]::GetTempFileName()

try {
  Set-Content -Path $tmp -Value $payload -Encoding utf8 -NoNewline
  npx vercel curl /api/v1/fortune/chat --deployment $DeploymentUrl -- --request POST --header "Content-Type: application/json" --data-binary "@$tmp"
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}
