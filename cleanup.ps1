# 强制删除dist-electron目录的脚本
Write-Host "正在清理dist-electron目录..."

# 检查目录是否存在
if (Test-Path "dist-electron") {
    Write-Host "找到dist-electron目录，正在尝试删除..."
    
    # 尝试使用不同的方法来删除
    $success = $false
    
    # 方法1: 使用Remove-Item
    try {
        Remove-Item -Recurse -Force "dist-electron" -ErrorAction Stop
        Write-Host "使用PowerShell删除成功!"
        $success = $true
    } catch {
        Write-Host "PowerShell删除失败: $($_.Exception.Message)"
    }
    
    # 如果方法1失败，尝试方法2
    if (-not $success) {
        try {
            cmd /c "rd /s /q dist-electron"
            Write-Host "使用cmd删除成功!"
            $success = $true
        } catch {
            Write-Host "cmd删除失败: $($_.Exception.Message)"
        }
    }
    
    # 如果方法2也失败，尝试方法3
    if (-not $success) {
        Write-Host "所有自动方法都失败了，可能需要手动删除或重启系统"
    }
} else {
    Write-Host "dist-electron目录不存在，无需清理"
}