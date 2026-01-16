#!/bin/bash
# Spec-Kit 快速安装脚本
# 版本: 1.0
# 说明: 此脚本帮助快速安装 Spec-Kit 规格驱动开发工具

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印信息函数
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 主安装流程
main() {
    echo "=========================================="
    echo "   Spec-Kit 安装脚本"
    echo "   规格驱动开发工具包"
    echo "=========================================="
    echo ""

    # 检查 Python
    if ! command_exists python3 && ! command_exists python; then
        error "未找到 Python。请先安装 Python 3.11 或更高版本。"
        exit 1
    fi

    PYTHON_CMD=$(command_exists python3 && echo "python3" || echo "python")
    PYTHON_VERSION=$($PYTHON_CMD --version | awk '{print $2}')

    info "检测到 Python 版本: $PYTHON_VERSION"

    # 检查 uv
    if command_exists uv; then
        info "检测到 uv，使用 uv 安装..."
        uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
    elif command_exists pip; then
        info "使用 pip 安装..."
        pip install specify-cli
    else
        error "未找到 uv 或 pip。请先安装 uv（推荐）或 pip。"
        echo ""
        echo "安装 uv:"
        echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
        echo ""
        echo "或访问: https://github.com/astral-sh/uv"
        exit 1
    fi

    echo ""
    info "Spec-Kit 安装完成！"
    echo ""
    echo "验证安装:"
    echo "  specify --version"
    echo ""
    echo "初始化新项目:"
    echo "  specify init"
    echo ""
    echo "更多帮助:"
    echo "  specify --help"
    echo ""
    echo "文档: https://github.com/github/spec-kit"
}

# 执行安装
main "$@"
