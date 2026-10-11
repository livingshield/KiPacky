Add-Type -AssemblyName System.Drawing

function Generate-Icon($size, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#0f172a'))

    # Background circle
    $margin = [int]($size * 0.08)
    $innerSize = $size - (2 * $margin)
    $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0284c7'))
    $g.FillEllipse($brushBg, $margin, $margin, $innerSize, $innerSize)

    # Outer border ring
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]($size * 0.04))
    $g.DrawEllipse($pen, $margin, $margin, $innerSize, $innerSize)

    # Clock hands
    $penHands = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]($size * 0.06))
    $penHands.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penHands.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $center = [float]($size / 2)
    $g.DrawLine($penHands, $center, $center, $center, [float]($size * 0.28))
    $g.DrawLine($penHands, $center, $center, [float]($size * 0.68), $center)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created icon: $outputPath"
}

Generate-Icon 192 "C:\Users\janky\.gemini\antigravity\scratch\Kipacky\frontend\public\icon-192.png"
Generate-Icon 512 "C:\Users\janky\.gemini\antigravity\scratch\Kipacky\frontend\public\icon-512.png"
