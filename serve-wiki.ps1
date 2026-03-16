param(
  [int]$Port = 8080
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Serving Aethrya wiki from: $root"
Write-Host "Local URL: http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

python -m http.server $Port --directory $root
