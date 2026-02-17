$j = Get-Content C:\Users\evanw\lint_report.json -Raw | ConvertFrom-Json
$j | Where-Object { $_.errorCount -gt 0 -or $_.warningCount -gt 0 } | ForEach-Object {
    $f = $_.filePath -replace '.*\\(src|server)\\', '$1\'
    $_.messages | Where-Object { $_.ruleId -ne $null } | ForEach-Object {
        Write-Output ('{0}:{1} [{2}]' -f $f, $_.line, $_.ruleId)
    }
}
