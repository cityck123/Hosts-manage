# GitHub开源设置指南

## 已完成的开源准备工作

✅ **已创建以下文件：**
- `.gitignore` - 排除不需要版本控制的文件
- `LICENSE` - MIT许可证文件
- 优化后的 `README.md` - 包含项目介绍、功能特性、安装说明等

## GitHub发布步骤

### 1. 在GitHub上创建新仓库

1. 登录GitHub账号
2. 点击右上角"+" → "New repository"
3. 填写仓库信息：
   - Repository name: `hosts-manager`
   - Description: "Windows Hosts文件桌面管理工具 - A powerful Windows Hosts file desktop management tool"
   - 选择公开 (Public)
   - 勾选"Add a README file"（可选，可以覆盖）
   - 选择MIT License

### 2. 本地Git设置和推送

```bash
# 初始化Git仓库
git init

# 添加远程仓库地址（替换your-username为您的GitHub用户名）
git remote add origin https://github.com/your-username/hosts-manager.git

# 添加所有文件到暂存区
git add .

# 创建第一次提交
git commit -m "feat: 初始提交 - Hosts文件管理器 v1.0.0

- 基于Vue 3 + Electron的现代化Hosts管理工具
- 支持添加、编辑、删除Hosts记录
- 智能备份和版本恢复功能
- 自动过滤注释行，界面简洁高效"

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 3. 创建第一个Release版本

1. 在GitHub仓库页面，点击"Releases"
2. 点击"Draft a new release"
3. 填写版本信息：
   - Tag version: `v1.0.0`
   - Release title: "Hosts文件管理器 v1.0.0"
   - 描述内容：
     ```
     ## 首个正式版本 v1.0.0
     
     ### 主要功能
     - 🚀 现代化界面设计
     - 🔒 安全的管理员权限管理
     - 💾 智能备份和恢复
     - 🔍 快速搜索过滤
     - ↩️ 完整的撤销重做功能
     
     ### 系统要求
     - Windows 10/11
     - 需要管理员权限
     ```
4. 上传预编译的安装包：
   - 将 `build-output-new/Hosts文件管理器 Setup 1.0.0.exe` 拖拽到附件区域
   - 将 `build-output-new/win-unpacked/Hosts文件管理器.exe` 也上传（便携版）

### 4. 更新README.md中的链接

推送完成后，需要更新README.md中的仓库链接：

```markdown
# 将
https://github.com/your-username/hosts-manager.git

# 替换为实际的仓库地址
https://github.com/your-actual-username/hosts-manager.git
```

## 项目结构说明

```
hosts-manager/
├── src/                 # 前端源码 (Vue 3)
│   ├── App.vue         # 主应用组件
│   └── main.js         # 入口文件
├── electron/           # Electron主进程代码
│   ├── main.js         # 主进程入口
│   ├── preload.js      # 预加载脚本
│   └── hostsService.js # Hosts文件服务
├── public/             # 静态资源
├── dist/               # 构建输出（前端）
├── build-output-new/   # Electron打包输出
├── package.json        # 项目配置
├── vite.config.js      # Vite配置
├── README.md           # 项目文档
├── LICENSE             # 许可证
└── .gitignore          # Git忽略文件
```

## 开发指南

### 开发环境启动
```bash
# 安装依赖
npm install

# 开发模式运行
npm run electron:dev
```

### 构建发布版本
```bash
# 构建前端
npm run build

# 构建Electron应用
npm run electron:build
```

## 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。