param(
  [Parameter(Mandatory = $true)][string]$BaseUrl
)

$installationId = 'wallet-smoke-001'

function Invoke-JsonPost {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][hashtable]$Body
  )

  return Invoke-RestMethod -Uri $Url -Method Post -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 6)
}

$before = Invoke-JsonPost -Url "$BaseUrl/api/v1/wallet/state" -Body @{
  installationId = $installationId
}

$credit = Invoke-JsonPost -Url "$BaseUrl/api/v1/wallet/credit" -Body @{
  installationId = $installationId
  amount = 2
  reason = 'manual_adjustment'
}

$after = Invoke-JsonPost -Url "$BaseUrl/api/v1/wallet/state" -Body @{
  installationId = $installationId
}

[pscustomobject]@{
  beforePaidCoins = $before.data.paidCoins
  afterCreditPaidCoins = $credit.data.wallet.paidCoins
  finalPaidCoins = $after.data.paidCoins
} | ConvertTo-Json -Compress
