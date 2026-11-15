# PraiseLyrics church TV wall: automatically press F11 for newly opened wall windows.
# Run once on the Windows PC that controls the TVs, then use Open Wall as normal.
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class PraiseWallWindows {
    public delegate bool EnumWindowCallback(IntPtr window, IntPtr data);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowCallback cb, IntPtr data);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr window, StringBuilder title, int maxLength);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr window, int mode);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window, out RECT rect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
$seen = @{}
Write-Host "PraiseLyrics Wall Auto-Fullscreen is running." -ForegroundColor Green
Write-Host "Open the PraiseLyrics controller and click Open Wall. Keep this helper running."
Write-Host "Press Ctrl+C to stop."
while ($true) {
    $windows = [System.Collections.Generic.List[IntPtr]]::new()
    $callback = [PraiseWallWindows+EnumWindowCallback] {
        param([IntPtr] $hwnd, [IntPtr] $unused)
        if (-not [PraiseWallWindows]::IsWindowVisible($hwnd)) { return $true }
        $title = [System.Text.StringBuilder]::new(512)
        [void][PraiseWallWindows]::GetWindowText($hwnd, $title, $title.Capacity)
        if ($title.ToString() -like "*PraiseLyrics TV Wall*") {
            $windows.Add($hwnd)
        }
        return $true
    }
    [void][PraiseWallWindows]::EnumWindows($callback, [IntPtr]::Zero)
    foreach ($hwnd in $windows) {
        $id = $hwnd.ToInt64().ToString()
        if ($seen.ContainsKey($id)) { continue }
        $rect = New-Object PraiseWallWindows+RECT
        if (-not [PraiseWallWindows]::GetWindowRect($hwnd, [ref]$rect)) { continue }
        $screen = [System.Windows.Forms.Screen]::FromHandle($hwnd).Bounds
        $full = ([Math]::Abs($rect.Left - $screen.Left) -le 8) -and
                ([Math]::Abs($rect.Top - $screen.Top) -le 8) -and
                ([Math]::Abs($rect.Right - $screen.Right) -le 8) -and
                ([Math]::Abs($rect.Bottom - $screen.Bottom) -le 8)
        if ($full) { $seen[$id] = $true; continue }
        [void][PraiseWallWindows]::ShowWindow($hwnd, 9)
        [void][PraiseWallWindows]::SetForegroundWindow($hwnd)
        Start-Sleep -Milliseconds 400
        [System.Windows.Forms.SendKeys]::SendWait('{F11}')
        $seen[$id] = $true
        Write-Host "Fullscreen requested for TV wall."
    }
    Start-Sleep -Milliseconds 900
}
