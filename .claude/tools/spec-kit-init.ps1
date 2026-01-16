# Spec-Kit 快速安装脚本 (PowerShell)
# 版本: 1.0
# 说明: 此脚本帮助快速安装 Spec-Kit 规格驱动开发工具

#Requires -Version 5.1

# 颜色输出函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查命令是否存在
function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# 主安装流程
function Main {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   Spec-Kit 安装脚本" -ForegroundColor Cyan
    Write-Host "   规格驱动开发工具包" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    # 检查 Python
    if (-not (Test-Command "python") -and -not (Test-Command "python3")) {
        Write-Error "未找到 Python。请先安装 Python 3.11 或更高版本。"
        Write-Host ""
        Write-Host "下载 Python: https://www.python.org/downloads/"
        exit 1
    }

    $pythonCmd = if (Test-Command "python3") { "python3" } else { "python" }
    $pythonVersion = & $pythonCmd --version
    Write-Info "检测到 Python 版本: $pythonVersion"

    # 检查 uv
    if (Test-Command "uv") {
        Write-Info "检测到 uv，使用 uv 安装..."
        uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
    }
    elseif (Test-Command "pip") {
        Write-Info "使用 pip 安装..."
        pip install specify-cli
    }
    else {
        Write-Error "未找到 uv 或 pip。请先安装 uv（推荐）或 pip。"
        Write-Host ""
        Write-Host "安装 uv (PowerShell):"
        Write-Host "  irm https://astral.sh/uv/install.ps1 | iex"
        Write-Host ""
        Write-Host "或访问: https://github.com/astral-sh/uv"
        exit 1
    }

    Write-Host ""
    Write-Info "Spec-Kit 安装完成！"
    Write-Host ""
    Write-Host "验证安装:" -ForegroundColor Cyan
    Write-Host "  specify --version"
    Write-Host ""
    Write-Host "初始化新项目:" -ForegroundColor Cyan
    Write-Host "  specify init"
    Write-Host ""
    Write-Host "更多帮助:" -ForegroundColor Cyan
    Write-Host "  specify --help"
    Write-Host ""
    Write-Host "文档: https://github.com/github/spec-kit"
}

# 执行安装
Main
