param(
  [string]$OutputRoot = "assets/store",
  [switch]$UpdateAndroidIcons = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2.0

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Get-StarPoints {
  param(
    [float]$CenterX,
    [float]$CenterY,
    [float]$OuterRadius,
    [float]$InnerRadius
  )

  $points = New-Object "System.Collections.Generic.List[System.Drawing.PointF]"
  for ($i = 0; $i -lt 10; $i++) {
    $angleDeg = -90 + ($i * 36)
    $angleRad = $angleDeg * [Math]::PI / 180.0
    $radius = if (($i % 2) -eq 0) { $OuterRadius } else { $InnerRadius }
    $x = $CenterX + ([Math]::Cos($angleRad) * $radius)
    $y = $CenterY + ([Math]::Sin($angleRad) * $radius)
    $points.Add((New-Object System.Drawing.PointF([float]$x, [float]$y)))
  }

  return $points.ToArray()
}

function Get-FontSafe {
  param(
    [string]$Preferred,
    [float]$Size,
    [System.Drawing.FontStyle]$Style
  )

  try {
    return New-Object System.Drawing.Font($Preferred, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  } catch {
    return New-Object System.Drawing.Font("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
  }
}

function Set-GraphicsQuality {
  param([System.Drawing.Graphics]$Graphics)
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
}

function Draw-BrandCore {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Size,
    [switch]$TransparentBase
  )

  if (-not $TransparentBase) {
    $bgRect = New-Object System.Drawing.RectangleF($X, $Y, $Size, $Size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $bgRect,
      [System.Drawing.Color]::FromArgb(255, 41, 38, 78),
      [System.Drawing.Color]::FromArgb(255, 73, 58, 123),
      40
    )
    $Graphics.FillRectangle($bgBrush, $bgRect)
    $bgBrush.Dispose()

    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 170, 255, 235))
    $Graphics.FillEllipse($glowBrush, $X + ($Size * 0.15), $Y + ($Size * 0.05), $Size * 0.70, $Size * 0.45)
    $glowBrush.Dispose()

    $shadeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42, 0, 0, 0))
    $Graphics.FillEllipse($shadeBrush, $X + ($Size * 0.08), $Y + ($Size * 0.65), $Size * 0.84, $Size * 0.32)
    $shadeBrush.Dispose()
  }

  $cardSize = $Size * 0.58
  $cardX = $X + (($Size - $cardSize) / 2)
  $cardY = $Y + (($Size - $cardSize) / 2) - ($Size * 0.02)
  $cardRadius = $cardSize * 0.19
  $cardPath = New-RoundedRectPath -X $cardX -Y $cardY -Width $cardSize -Height $cardSize -Radius $cardRadius

  $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(44, 255, 255, 255))
  $Graphics.FillPath($cardBrush, $cardPath)
  $cardBrush.Dispose()

  $cardEdge = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 255, 255, 255), [float]($Size * 0.006))
  $cardEdge.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Graphics.DrawPath($cardEdge, $cardPath)
  $cardEdge.Dispose()
  $cardPath.Dispose()

  $centerX = $cardX + ($cardSize * 0.50)
  $centerY = $cardY + ($cardSize * 0.51)
  $outer = $cardSize * 0.17
  $inner = $outer * 0.45

  $starPoints = Get-StarPoints -CenterX $centerX -CenterY $centerY -OuterRadius $outer -InnerRadius $inner
  $symbolPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 161, 176), [float]($Size * 0.021))
  $symbolPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $symbolPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $symbolPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawPolygon($symbolPen, $starPoints)

  $slashStart = New-Object System.Drawing.PointF([float]($centerX - ($outer * 0.85)), [float]($centerY + ($outer * 0.82)))
  $slashEnd = New-Object System.Drawing.PointF([float]($centerX + ($outer * 0.78)), [float]($centerY - ($outer * 0.78)))
  $Graphics.DrawLine($symbolPen, $slashStart, $slashEnd)
  $symbolPen.Dispose()

  $sparkCenterX = $cardX + ($cardSize * 0.91)
  $sparkCenterY = $cardY + ($cardSize * 0.10)
  $sparkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 135, 243, 168), [float]($Size * 0.014))
  $sparkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $sparkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($sparkPen, [float]($sparkCenterX - ($Size * 0.018)), $sparkCenterY, [float]($sparkCenterX + ($Size * 0.018)), $sparkCenterY)
  $Graphics.DrawLine($sparkPen, $sparkCenterX, [float]($sparkCenterY - ($Size * 0.018)), $sparkCenterX, [float]($sparkCenterY + ($Size * 0.018)))
  $Graphics.DrawLine($sparkPen, [float]($sparkCenterX - ($Size * 0.012)), [float]($sparkCenterY - ($Size * 0.012)), [float]($sparkCenterX + ($Size * 0.012)), [float]($sparkCenterY + ($Size * 0.012)))
  $Graphics.DrawLine($sparkPen, [float]($sparkCenterX - ($Size * 0.012)), [float]($sparkCenterY + ($Size * 0.012)), [float]($sparkCenterX + ($Size * 0.012)), [float]($sparkCenterY - ($Size * 0.012)))
  $sparkPen.Dispose()
}

function New-BrandSquareBitmap {
  param(
    [int]$Size,
    [switch]$TransparentBase
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-GraphicsQuality -Graphics $graphics

  if ($TransparentBase) {
    $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  } else {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 41, 38, 78))
  }

  Draw-BrandCore -Graphics $graphics -X 0 -Y 0 -Size $Size -TransparentBase:$TransparentBase
  $graphics.Dispose()
  return $bitmap
}

function Save-ScaledPng {
  param(
    [System.Drawing.Image]$SourceImage,
    [int]$Width,
    [int]$Height,
    [string]$Path
  )

  $target = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($target)
  Set-GraphicsQuality -Graphics $g
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $g.DrawImage($SourceImage, 0, 0, $Width, $Height)
  $g.Dispose()
  $target.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $target.Dispose()
}

function Draw-Badge {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [string]$Text,
    [System.Drawing.Font]$Font
  )

  $paddingX = 22.0
  $paddingY = 12.0
  $size = $Graphics.MeasureString($Text, $Font)
  $width = $size.Width + ($paddingX * 2)
  $height = $size.Height + ($paddingY * 2)
  $radius = 20.0

  $path = New-RoundedRectPath -X $X -Y $Y -Width $width -Height $height -Radius $radius
  $fillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 255, 255, 255))
  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 255, 255), 2)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 236, 239, 255))

  $Graphics.FillPath($fillBrush, $path)
  $Graphics.DrawPath($borderPen, $path)
  $Graphics.DrawString($Text, $Font, $textBrush, [float]($X + $paddingX), [float]($Y + $paddingY))

  $fillBrush.Dispose()
  $borderPen.Dispose()
  $textBrush.Dispose()
  $path.Dispose()
}

function New-FeatureGraphicBitmap {
  param([System.Drawing.Image]$IconImage)

  $width = 1024
  $height = 500
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-GraphicsQuality -Graphics $graphics

  $bgRect = New-Object System.Drawing.RectangleF(0, 0, $width, $height)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.Color]::FromArgb(255, 36, 33, 70),
    [System.Drawing.Color]::FromArgb(255, 90, 63, 142),
    10
  )
  $graphics.FillRectangle($bgBrush, $bgRect)
  $bgBrush.Dispose()

  $soft1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 129, 240, 204))
  $graphics.FillEllipse($soft1, -90, 260, 470, 290)
  $soft1.Dispose()
  $soft2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 255, 166, 184))
  $graphics.FillEllipse($soft2, 610, -120, 470, 330)
  $soft2.Dispose()

  $iconX = 78.0
  $iconY = 92.0
  $iconSize = 304.0
  $iconPath = New-RoundedRectPath -X $iconX -Y $iconY -Width $iconSize -Height $iconSize -Radius 72.0
  $graphics.SetClip($iconPath)
  $graphics.DrawImage($IconImage, $iconX, $iconY, $iconSize, $iconSize)
  $graphics.ResetClip()
  $iconPath.Dispose()

  $iconBorderPath = New-RoundedRectPath -X $iconX -Y $iconY -Width $iconSize -Height $iconSize -Radius 72.0
  $iconBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(115, 255, 255, 255), 3)
  $graphics.DrawPath($iconBorderPen, $iconBorderPath)
  $iconBorderPen.Dispose()
  $iconBorderPath.Dispose()

  $titleFont = Get-FontSafe -Preferred "Bahnschrift SemiBold" -Size 86 -Style ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = Get-FontSafe -Preferred "Bahnschrift SemiBold" -Size 33 -Style ([System.Drawing.FontStyle]::Regular)
  $badgeFont = Get-FontSafe -Preferred "Segoe UI Semibold" -Size 22 -Style ([System.Drawing.FontStyle]::Regular)

  $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 247, 246, 255))
  $subtitleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 210, 255, 228))
  $graphics.DrawString("SAZOO", $titleFont, $titleBrush, 420, 120)
  $graphics.DrawString("AI SAJU | 3D HEALING", $subtitleFont, $subtitleBrush, 424, 212)

  Draw-Badge -Graphics $graphics -X 424 -Y 292 -Text "PERSONAL AI GUIDE" -Font $badgeFont
  Draw-Badge -Graphics $graphics -X 424 -Y 352 -Text "DAILY FORTUNE FLOW" -Font $badgeFont

  $titleBrush.Dispose()
  $subtitleBrush.Dispose()
  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $badgeFont.Dispose()
  $graphics.Dispose()

  return $bitmap
}

$projectRoot = Resolve-Path "."
$storeDir = Join-Path $projectRoot $OutputRoot
New-Item -ItemType Directory -Path $storeDir -Force | Out-Null

$icon1024Path = Join-Path $storeDir "app-icon-1024.png"
$icon512Path = Join-Path $storeDir "play-icon-512.png"
$featurePath = Join-Path $storeDir "play-feature-1024x500.png"

$icon1024 = New-BrandSquareBitmap -Size 1024
$icon1024.Save($icon1024Path, [System.Drawing.Imaging.ImageFormat]::Png)

Save-ScaledPng -SourceImage $icon1024 -Width 512 -Height 512 -Path $icon512Path

$feature = New-FeatureGraphicBitmap -IconImage $icon1024
$feature.Save($featurePath, [System.Drawing.Imaging.ImageFormat]::Png)
$feature.Dispose()

if ($UpdateAndroidIcons) {
  $legacySizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
  }

  $foregroundSizes = @{
    "mipmap-mdpi" = 108
    "mipmap-hdpi" = 162
    "mipmap-xhdpi" = 216
    "mipmap-xxhdpi" = 324
    "mipmap-xxxhdpi" = 432
  }

  $androidResRoot = Join-Path $projectRoot "android/app/src/main/res"

  foreach ($folder in $legacySizes.Keys) {
    $size = [int]$legacySizes[$folder]
    $legacyPath = Join-Path (Join-Path $androidResRoot $folder) "ic_launcher.png"
    $roundPath = Join-Path (Join-Path $androidResRoot $folder) "ic_launcher_round.png"
    Save-ScaledPng -SourceImage $icon1024 -Width $size -Height $size -Path $legacyPath
    Save-ScaledPng -SourceImage $icon1024 -Width $size -Height $size -Path $roundPath
  }

  foreach ($folder in $foregroundSizes.Keys) {
    $size = [int]$foregroundSizes[$folder]
    $fgPath = Join-Path (Join-Path $androidResRoot $folder) "ic_launcher_foreground.png"
    $foreground = New-BrandSquareBitmap -Size $size -TransparentBase
    $foreground.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $foreground.Dispose()
  }
}

$icon1024.Dispose()

Write-Output "Generated:"
Write-Output " - $icon1024Path"
Write-Output " - $icon512Path"
Write-Output " - $featurePath"
