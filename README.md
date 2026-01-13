# Hosts文件管理器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.3.3-blue.svg)](https://electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4.0-green.svg)](https://vuejs.org/)

一个功能强大的Windows Hosts文件桌面管理工具，帮助您轻松管理Hosts文件记录。

## ✨ 特色功能

- 🚀 **现代化界面** - 基于Vue 3和Element Plus的现代化UI设计
- 🔒 **安全可靠** - 自动请求管理员权限，确保文件操作安全
- 💾 **智能备份** - 每次修改前自动创建备份，支持版本恢复
- 🔍 **智能搜索** - 支持按IP地址和域名快速搜索过滤
- ↩️ **撤销重做** - 完整的操作历史记录，支持撤销和重做
- 📱 **简洁高效** - 自动过滤注释行，只显示有效Hosts条目

## 功能特性

### 核心功能
- **查看记录**: 以表格形式清晰展示所有Hosts记录，包括IP地址、域名和注释
- **添加记录**: 提供表单界面添加新记录，支持实时格式验证
- **编辑记录**: 支持直接编辑表格中的记录，或通过编辑对话框修改
- **删除记录**: 支持单条删除和批量删除，执行前显示确认对话框

### 高级功能
- **管理员权限**: 自动请求管理员权限以确保对Hosts文件的读写权限
- **备份恢复**: 
  - 每次修改前自动创建备份
  - 支持手动创建备份
  - 可恢复到任意历史版本
- **撤销/重做**: 支持完整的撤销和重做功能
- **搜索过滤**: 支持按IP地址和域名快速搜索记录

### 错误处理
- 文件访问权限不足检测
- 文件格式错误处理
- 输入格式验证
- 明确的错误提示信息

## 技术架构

- **前端**: Vue 3 + Element Plus
- **后端**: Electron (Node.js)
- **打包工具**: electron-builder
- **运行环境**: Windows 10/11

## 📸 界面预览

> *截图展示应用界面*

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.0 或更高版本
- **操作系统**: Windows 10/11
- **权限**: 管理员权限（用于修改系统Hosts文件）

### 方式一：下载预编译版本（推荐）

1. 前往 [Releases](https://github.com/your-username/hosts-manager/releases) 页面下载最新版本
2. 运行 `Hosts文件管理器 Setup 1.0.0.exe` 进行安装
3. 启动程序，享受便捷的Hosts管理体验

### 方式二：从源码构建

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/hosts-manager.git
   cd hosts-manager
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式运行**
   ```bash
   npm run electron:dev
   ```

4. **构建安装包**
   ```bash
   npm run electron:build
   ```

   构建完成后，安装包将生成在 `build-output-new` 目录下。

## 使用说明

### 启动程序
首次启动时，程序会自动请求管理员权限。点击"确定"以管理员身份运行。

### 主界面介绍
- **左侧表格**: 显示所有Hosts记录，可直接编辑
- **右侧面板**: 备份管理区域
- **顶部工具栏**: 撤销、重做、打开文件、刷新等功能

### 添加新记录
1. 点击"添加记录"按钮
2. 在弹出的对话框中输入：
   - IP地址: 例如 `127.0.0.1`
   - 域名: 例如 `example.com`
   - 注释: 可选
3. 点击"添加"确认

### 编辑记录
1. 在表格中直接修改IP、域名或注释内容
2. 失去焦点后自动保存
3. 或点击编辑按钮打开编辑对话框

### 删除记录
1. 单条删除: 点击记录后的删除按钮
2. 批量删除: 勾选多条记录，点击"删除选中"
3. 确认删除操作

### 备份管理
- **创建备份**: 点击"创建备份"按钮
- **恢复备份**: 选择备份记录，点击"恢复选中备份"
- **打开备份文件夹**: 查看所有备份文件

### 撤销/重做
- 点击工具栏的"撤销"按钮撤销最近操作
- 点击"重做"按钮恢复被撤销的操作
- 或使用快捷键: Ctrl+Z (撤销), Ctrl+Y (重做)

## 文件位置

- **Hosts文件**: `C:\Windows\System32\drivers\etc\hosts`
- **备份目录**: `%APPDATA%\hosts-manager\backups`

## 常见问题

### Q: 为什么需要管理员权限?
A: Hosts文件位于系统保护目录，需要管理员权限才能修改。

### Q: 备份文件在哪里?
A: 备份文件存储在 `%APPDATA%\hosts-manager\backups` 目录下。

### Q: 如何恢复到原始状态?
A: 在备份列表中找到创建时间最早的备份，点击"恢复选中备份"。

### Q: 误删了记录怎么办?
A: 使用"撤销"功能可以恢复最近删除的记录。

## 错误处理

程序会处理以下常见错误:
- **权限不足**: 提示用户以管理员身份重新运行
- **文件不存在**: 提示Hosts文件路径错误
- **格式错误**: 提示记录格式不正确
- **网络异常**: 提示操作超时

## 开发说明

### 项目结构
```
hosts-manager/
├── electron/
│   ├── main.js          # Electron主进程
│   ├── preload.js       # 预加载脚本
│   └── hostsService.js  # Hosts文件操作服务
├── src/
│   ├── App.vue          # 主应用组件
│   └── main.js          # Vue入口
├── public/
│   └── index.html       # HTML模板
├── package.json         # 项目配置
└── vite.config.js       # Vite配置
```

### 技术栈
- Vue 3 组合式API
- Element Plus UI组件库
- Electron 主进程架构
- IPC 进程间通信

## 许可证

MIT License

## 贡献者

感谢所有为这个项目做出贡献的人！

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。
