# Python 配置说明

## 🐍 Python 已成功配置！

您的系统已安装 **Python 3.12.4**，现在可以使用以下命令：

### 📋 基本命令
```bash
# 检查Python版本
python --version
py --version

# 启动HTTP服务器
python -m http.server 8000
py -m http.server 8000

# 安装Python包
pip install package_name
py -m pip install package_name
```

### 🌐 启动采购单管理系统
```bash
# 方法1：使用python命令
python -m http.server 8000

# 方法2：使用py命令
py -m http.server 8000

# 然后在浏览器中访问：http://localhost:8000
```

### ⚙️ 环境配置
- **Python版本**: 3.12.4
- **安装路径**: `C:\Program Files\Python312`
- **pip版本**: 25.1.1
- **别名设置**: `python` 命令已映射到 `py`

### 🔧 手动配置（如果需要）
如果重启后 `python` 命令失效，请运行：
```powershell
Set-Alias -Name python -Value py
```

### 📦 常用Python包安装
```bash
# 安装requests（HTTP请求库）
pip install requests

# 安装pandas（数据分析库）
pip install pandas

# 安装flask（Web框架）
pip install flask
```

### 🎯 当前项目
您的采购单管理系统现在可以通过以下方式启动：
1. 运行 `python -m http.server 8000`
2. 在浏览器中访问 `http://localhost:8000`
3. 开始使用采购单管理系统！

---
**配置完成时间**: $(Get-Date)
**Python版本**: 3.12.4 