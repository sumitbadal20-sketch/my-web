param(
  [string]$Repo = "https://github.com/sumitbadal20-sketch/my-web",
  [string]$Branch = "main",
  [string]$ServiceName = "therealrider"
)

$ErrorActionPreference = "Stop"

if (-not $env:RENDER_API_KEY) {
  throw "Set RENDER_API_KEY first. Example: `$env:RENDER_API_KEY = 'your-render-api-key'"
}

$headers = @{
  Authorization = "Bearer $env:RENDER_API_KEY"
  Accept = "application/json"
  "Content-Type" = "application/json"
}

$owners = Invoke-RestMethod -Method Get -Uri "https://api.render.com/v1/owners?limit=1" -Headers $headers
if (-not $owners -or -not $owners[0].owner.id) {
  throw "No Render workspace found for this API key."
}

$ownerId = $owners[0].owner.id

$body = @{
  type = "static_site"
  name = $ServiceName
  ownerId = $ownerId
  repo = $Repo
  branch = $Branch
  autoDeploy = "yes"
  serviceDetails = @{
    buildCommand = ""
    publishPath = "."
  }
} | ConvertTo-Json -Depth 10

$service = Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services" -Headers $headers -Body $body
$service | ConvertTo-Json -Depth 10
