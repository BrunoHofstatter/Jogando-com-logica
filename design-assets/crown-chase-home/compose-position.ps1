param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "crown-chase-position-three-moves.png")
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

if (-not ("CrownChaseAlphaBounds" -as [type])) {
  $drawingReferences = @(
    [System.Drawing.Bitmap].Assembly.Location
    [System.Drawing.Rectangle].Assembly.Location
  )

  Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class CrownChaseAlphaBounds
{
    public static Rectangle Find(Bitmap bitmap, byte threshold)
    {
        var full = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        BitmapData data = bitmap.LockBits(
            full,
            ImageLockMode.ReadOnly,
            PixelFormat.Format32bppArgb
        );

        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] bytes = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);

            int minX = bitmap.Width;
            int minY = bitmap.Height;
            int maxX = -1;
            int maxY = -1;

            for (int y = 0; y < bitmap.Height; y++)
            {
                int row = data.Stride >= 0
                    ? y * stride
                    : (bitmap.Height - 1 - y) * stride;

                for (int x = 0; x < bitmap.Width; x++)
                {
                    byte alpha = bytes[row + (x * 4) + 3];
                    if (alpha < threshold)
                    {
                        continue;
                    }

                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }

            if (maxX < minX || maxY < minY)
            {
                return Rectangle.Empty;
            }

            return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
    }
}
"@ -ReferencedAssemblies $drawingReferences
}

$boardPath = Join-Path $PSScriptRoot "empty-board.png"
$piecesPath = Join-Path $PSScriptRoot "pieces"

$squareCenters = @{
  a5 = @(448, 145); b5 = @(629, 158); c5 = @(808, 170); d5 = @(992, 183); e5 = @(1181, 198)
  a4 = @(407, 270); b4 = @(587, 282); c4 = @(770, 296); d4 = @(956, 312); e4 = @(1145, 329)
  a3 = @(363, 409); b3 = @(547, 421); c3 = @(733, 434); d3 = @(920, 451); e3 = @(1111, 468)
  a2 = @(322, 552); b2 = @(508, 564); c2 = @(695, 579); d2 = @(883, 596); e2 = @(1074, 614)
  a1 = @(276, 700); b1 = @(465, 713); c1 = @(656, 730); d1 = @(847, 747); e1 = @(1038, 765)
}

# Position after the legal sequence a3-a4, d5-c4, b1-c2.
# Pieces are listed back-to-front so nearer ranks paint over farther ranks.
$placements = @(
  [pscustomobject]@{ Coordinate = "c5"; Asset = "red-jumper.png" }
  [pscustomobject]@{ Coordinate = "e5"; Asset = "red-king.png" }
  [pscustomobject]@{ Coordinate = "a4"; Asset = "blue-jumper.png" }
  [pscustomobject]@{ Coordinate = "c4"; Asset = "red-assassin.png" }
  [pscustomobject]@{ Coordinate = "d4"; Asset = "red-jumper.png" }
  [pscustomobject]@{ Coordinate = "e4"; Asset = "red-assassin.png" }
  [pscustomobject]@{ Coordinate = "e3"; Asset = "red-jumper.png" }
  [pscustomobject]@{ Coordinate = "a2"; Asset = "blue-assassin.png" }
  [pscustomobject]@{ Coordinate = "b2"; Asset = "blue-jumper.png" }
  [pscustomobject]@{ Coordinate = "c2"; Asset = "blue-assassin.png" }
  [pscustomobject]@{ Coordinate = "a1"; Asset = "blue-king.png" }
  [pscustomobject]@{ Coordinate = "c1"; Asset = "blue-jumper.png" }
)

$board = [System.Drawing.Bitmap]::FromFile($boardPath)
$canvas = New-Object System.Drawing.Bitmap(
  $board.Width,
  $board.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)

try {
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($board, 0, 0, $board.Width, $board.Height)

  foreach ($placement in $placements) {
    $coordinate = $placement.Coordinate
    $center = $squareCenters[$coordinate]
    $rank = [int]$coordinate.Substring(1, 1)
    $targetWidth = 112 + ((5 - $rank) * 4)

    $piecePath = Join-Path $piecesPath $placement.Asset
    $piece = [System.Drawing.Bitmap]::FromFile($piecePath)

    try {
      # Ignore the intentionally soft extraction glow and use the opaque token itself.
      $sourceBounds = [CrownChaseAlphaBounds]::Find($piece, 220)
      if ($sourceBounds.IsEmpty) {
        throw "No opaque token pixels found in $piecePath"
      }

      $aspectRatio = $sourceBounds.Height / $sourceBounds.Width
      $targetHeight = [int][Math]::Round($targetWidth * $aspectRatio)
      $left = [int][Math]::Round($center[0] - ($targetWidth / 2))
      $top = [int][Math]::Round($center[1] - ($targetHeight / 2))

      $shadowWidth = [int][Math]::Round($targetWidth * 0.72)
      $shadowHeight = [int][Math]::Round($targetHeight * 0.16)
      $shadowLeft = [int][Math]::Round($center[0] - ($shadowWidth / 2))
      $shadowTop = [int][Math]::Round($center[1] + ($targetHeight * 0.27))
      $shadowBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(72, 32, 17, 48)
      )

      try {
        $graphics.FillEllipse(
          $shadowBrush,
          $shadowLeft,
          $shadowTop,
          $shadowWidth,
          $shadowHeight
        )
      }
      finally {
        $shadowBrush.Dispose()
      }

      $destination = New-Object System.Drawing.Rectangle(
        $left,
        $top,
        $targetWidth,
        $targetHeight
      )
      $graphics.DrawImage(
        $piece,
        $destination,
        $sourceBounds.X,
        $sourceBounds.Y,
        $sourceBounds.Width,
        $sourceBounds.Height,
        [System.Drawing.GraphicsUnit]::Pixel
      )
    }
    finally {
      $piece.Dispose()
    }
  }

  $outputDirectory = Split-Path -Parent $OutputPath
  if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }

  $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $graphics.Dispose()
  $canvas.Dispose()
  $board.Dispose()
}

Write-Output "Saved $OutputPath"
$placements | Select-Object Coordinate, Asset | Format-Table -AutoSize
