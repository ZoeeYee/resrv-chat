# Firebase 配置助手脚本
# 这个脚本会帮助你创建 .env 文件模板

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase 配置助手" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查前端 .env
$frontendEnv = "frontend\.env"
if (Test-Path $frontendEnv) {
    Write-Host "✓ 前端 .env 文件已存在" -ForegroundColor Green
} else {
    Write-Host "✗ 前端 .env 文件不存在" -ForegroundColor Yellow
    Write-Host "  需要创建: $frontendEnv" -ForegroundColor Yellow
}

# 检查后端 .env
$backendEnv = "backend\.env"
if (Test-Path $backendEnv) {
    Write-Host "✓ 后端 .env 文件已存在" -ForegroundColor Green
} else {
    Write-Host "✗ 后端 .env 文件不存在" -ForegroundColor Yellow
    Write-Host "  需要创建: $backendEnv" -ForegroundColor Yellow
}

# 检查 Firebase 服务账号文件
$firebaseKey = "backend\firebase-service-account.json"
if (Test-Path $firebaseKey) {
    Write-Host "✓ Firebase 服务账号文件已存在" -ForegroundColor Green
} else {
    Write-Host "✗ Firebase 服务账号文件不存在" -ForegroundColor Yellow
    Write-Host "  需要从 Firebase Console 下载" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  配置步骤：" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 访问 Firebase Console: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. 创建项目并启用 Email/Password 认证" -ForegroundColor White
Write-Host "3. 获取前端配置信息" -ForegroundColor White
Write-Host "4. 下载服务账号密钥文件" -ForegroundColor White
Write-Host "5. 创建 .env 文件并填入配置" -ForegroundColor White
Write-Host ""
Write-Host "详细步骤请参考: 快速配置指南.md" -ForegroundColor Yellow
Write-Host ""

# 询问是否要创建模板文件
$create = Read-Host "是否要创建 .env 模板文件？(y/n)"
if ($create -eq "y" -or $create -eq "Y") {
    # 创建前端 .env 模板
    if (-not (Test-Path $frontendEnv)) {
        $frontendContent = @"
# Firebase 配置
# 请从 Firebase Console 获取这些值并填入
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# 后端 API 地址
VITE_API_BASE=http://localhost:8000
"@
        Set-Content -Path $frontendEnv -Value $frontendContent
        Write-Host "✓ 已创建前端 .env 模板文件" -ForegroundColor Green
    }
    
    # 创建后端 .env 模板
    if (-not (Test-Path $backendEnv)) {
        $backendContent = @"
# Firebase Admin SDK 配置
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json

# 数据库配置（如果未设置，将使用 SQLite）
DATABASE_URL=sqlite:///./resrv.db
"@
        Set-Content -Path $backendEnv -Value $backendContent
        Write-Host "✓ 已创建后端 .env 模板文件" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "1. 打开 Firebase Console 获取配置信息" -ForegroundColor White
    Write-Host "2. 编辑 frontend\.env 和 backend\.env 文件" -ForegroundColor White
    Write-Host "3. 下载服务账号密钥文件到 backend\ 目录" -ForegroundColor White
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

