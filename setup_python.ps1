# Python环境配置脚本
Write-Host "正在配置Python环境..." -ForegroundColor Green

# 设置Python路径
$env:PYTHON_PATH = "C:\Program Files\Python312"
$env:PYTHON_SCRIPTS = "$env:USERPROFILE\AppData\Roaming\Python\Python312\Scripts"

# 添加到PATH环境变量
$env:PATH = "$env:PYTHON_PATH;$env:PYTHON_SCRIPTS;$env:PATH"

# 创建python命令别名
Set-Alias -Name python -Value py

Write-Host "Python环境配置完成！" -ForegroundColor Green
Write-Host "现在您可以使用以下命令：" -ForegroundColor Yellow
Write-Host "- python --version" -ForegroundColor Cyan
Write-Host "- python -m http.server 8000" -ForegroundColor Cyan
Write-Host "- pip install package_name" -ForegroundColor Cyan

# 测试Python
Write-Host "`n测试Python安装..." -ForegroundColor Yellow
python --version 