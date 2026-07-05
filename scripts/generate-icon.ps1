# Generates a simple のびちゃん-branded app icon (replaces the default electron-vite logo).
# Not a build-time script — run manually whenever the icon design needs regenerating.
Add-Type -AssemblyName System.Drawing

function New-NobiIcon([string]$OutPath, [int]$Size) {
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $s = $Size / 1024.0

    # Rounded-square background card, brand green
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 63, 155, 84))
    $radius = 220 * $s
    $rect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($bgBrush, $path)

    # Body (two-tone ellipse, matches PetCharacter.tsx idle body)
    $bodyOuter = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 191, 240, 196))
    $bodyInner = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 217, 247, 220))
    $g.FillEllipse($bodyOuter, (512 - 340) * $s, (560 - 320) * $s, 680 * $s, 640 * $s)
    $g.FillEllipse($bodyInner, (512 - 340) * $s, (590 - 270) * $s, 680 * $s, 540 * $s)

    # Sprout leaves on top, two rotated ellipses
    $leafLeft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 111, 191, 115))
    $leafRight = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 79, 169, 85))
    $g.TranslateTransform(512 * $s, 220 * $s)
    $g.RotateTransform(-35)
    $g.FillEllipse($leafLeft, -95 * $s, -40 * $s, 190 * $s, 80 * $s)
    $g.ResetTransform()
    $g.TranslateTransform(512 * $s, 220 * $s)
    $g.RotateTransform(35)
    $g.FillEllipse($leafRight, -95 * $s, -40 * $s, 190 * $s, 80 * $s)
    $g.ResetTransform()

    # Blush
    $blush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(170, 255, 179, 192))
    $g.FillEllipse($blush, (330 - 55) * $s, (570 - 35) * $s, 110 * $s, 70 * $s)
    $g.FillEllipse($blush, (694 - 55) * $s, (570 - 35) * $s, 110 * $s, 70 * $s)

    # Happy eyes (upward curves)
    $eyePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 58, 46, 31)), (26 * $s)
    $eyePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $eyePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawBezier($eyePen, (340 * $s), (500 * $s), (375 * $s), (440 * $s), (410 * $s), (440 * $s), (445 * $s), (500 * $s))
    $g.DrawBezier($eyePen, (579 * $s), (500 * $s), (614 * $s), (440 * $s), (649 * $s), (440 * $s), (684 * $s), (500 * $s))

    # Smiling mouth
    $mouthBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 168, 69, 47))
    $mouthPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $mouthPath.AddBezier((430 * $s), (585 * $s), (460 * $s), (700 * $s), (564 * $s), (700 * $s), (594 * $s), (585 * $s))
    $mouthPath.AddBezier((594 * $s), (585 * $s), (564 * $s), (630 * $s), (460 * $s), (630 * $s), (430 * $s), (585 * $s))
    $mouthPath.CloseFigure()
    $g.FillPath($mouthBrush, $mouthPath)

    $g.Dispose()
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

New-NobiIcon -OutPath "c:\Users\maxia\Desktop\claude_product\Nobi\build\icon.png" -Size 1024
New-NobiIcon -OutPath "c:\Users\maxia\Desktop\claude_product\Nobi\resources\icon.png" -Size 512
Write-Output "done"
