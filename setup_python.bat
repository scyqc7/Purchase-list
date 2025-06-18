@echo off
echo 正在配置Python环境...

REM 设置Python路径
set PYTHON_PATH=C:\Program Files\Python312
set PYTHON_SCRIPTS=C:\Users\scyqc7\AppData\Roaming\Python\Python312\Scripts

REM 添加到PATH环境变量
set PATH=%PYTHON_PATH%;%PYTHON_SCRIPTS%;%PATH%

REM 创建python命令别名
doskey python=py $*

echo Python环境配置完成！
echo 现在您可以使用以下命令：
echo - python --version
echo - python -m http.server 8000
echo - pip install package_name

REM 保持窗口打开
pause 