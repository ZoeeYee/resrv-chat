# 快速上傳到 GitHub 腳本
# 使用方法：在 PowerShell 中執行此腳本

Write-Host "=== 準備上傳專案到 GitHub ===" -ForegroundColor Cyan
Write-Host ""

# 檢查是否在正確的目錄
$currentDir = Get-Location
Write-Host "目前目錄: $currentDir" -ForegroundColor Yellow

# 步驟 1: 解決 Git 所有權問題
Write-Host "步驟 1: 設定 Git 安全目錄..." -ForegroundColor Green
git config --global --add safe.directory F:/InteractiveHW/Resrv/Resrv

# 步驟 2: 初始化 Git（如果還沒初始化）
Write-Host "步驟 2: 初始化 Git 倉庫..." -ForegroundColor Green
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git 倉庫已初始化" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Git 倉庫已存在" -ForegroundColor Yellow
}

# 步驟 3: 添加所有檔案
Write-Host "步驟 3: 添加檔案到暫存區..." -ForegroundColor Green
git add .
Write-Host "✅ 檔案已添加" -ForegroundColor Green

# 步驟 4: 建立提交
Write-Host "步驟 4: 建立提交..." -ForegroundColor Green
git commit -m "初始提交：整合 Firebase Auth 和 Secured API"
Write-Host "✅ 提交已建立" -ForegroundColor Green

# 步驟 5: 設定分支名稱
Write-Host "步驟 5: 設定分支名稱..." -ForegroundColor Green
git branch -M main
Write-Host "✅ 分支已設定為 main" -ForegroundColor Green

# 步驟 6: 連接遠端倉庫
Write-Host "步驟 6: 連接 GitHub 遠端倉庫..." -ForegroundColor Green
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "ℹ️  遠端倉庫已存在，更新中..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/ZoeeYee/Resrv.git
} else {
    git remote add origin https://github.com/ZoeeYee/Resrv.git
}
Write-Host "✅ 遠端倉庫已連接" -ForegroundColor Green

# 步驟 7: 顯示狀態
Write-Host ""
Write-Host "=== 準備推送 ===" -ForegroundColor Cyan
Write-Host "遠端倉庫: https://github.com/ZoeeYee/Resrv.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "下一步：執行以下命令推送代碼：" -ForegroundColor Green
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意：首次推送可能需要輸入 GitHub 使用者名稱和 Personal Access Token" -ForegroundColor Yellow

