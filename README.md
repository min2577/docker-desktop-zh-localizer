# Docker Desktop 中文化工具

**非官方、实验性、源码发布。当前为 `0.1.0-alpha.1`，仅适配 Windows x64 Docker Desktop 4.68.0（223695）的特定原始文件。**

本项目通过本地界面翻译层，为 Docker Desktop 的菜单、按钮、提示和动态页面补充中文。词库约 4,200 条，包含上游译文、静态界面文字初译和人工校正。

这不是 Docker 官方插件，也不是 Docker Desktop 的开源版本。官方扩展 SDK 的独立页面机制不能直接替换宿主全部菜单。本项目修改本机安装的界面资源和前端程序中的资源摘要。

## 先了解边界

- 仓库和源码压缩包不提供 Docker 的 EXE、ASAR、DLL、原生模块或安装程序。你需要自行安装官方原版。
- 修改前端 EXE 内的资源摘要会让该文件原厂数字签名失效。未验证其他版本、ARM、macOS、Linux 或组织管理环境；不匹配就拒绝生成。
- 工具源码采用 GPL-3.0-only，不能据此推断 Docker Desktop 本身可自由修改或重新分发。请核对 [Docker 协议第 3.3 节](https://www.docker.com/legal/docker-subscription-service-agreement/)中的修改、翻译、逆向和分发限制及适用授权。
- 目前已通过自动化 DOM/打包验证，尚未完成全部页面的实际视觉验收。部分未知动态文字、扩展、远程页面仍可能保持英文；不要把 Alpha 当作跨版本正式版。
- 安装需要完整退出 Docker Desktop，会中断运行中的容器。请自行安排退出时间；脚本不会自动停止工作负载、清理数据、修改 AI 开关或恢复出厂。

## 使用方法

需要 Git、Node.js 26（也支持 package.json 中列出的兼容版本）、官方原版 Windows x64 Docker Desktop 4.68.0。已经安装其他汉化补丁时，请先使用该补丁自己的备份恢复原版；不要交叉覆盖不同补丁。

### 1. 下载本项目源码并生成本地补丁

在解压或克隆后的项目目录打开 PowerShell：

```powershell
npm ci --ignore-scripts
npm test
npm run prepare:patch
```

默认读取 `C:\Program Files\Docker\Docker`，生成 `.local`，不修改已安装的 Docker。

自定义安装目录：

```powershell
npm run prepare:patch -- --docker-dir "D:\Apps\Docker\Docker"
```

如果文件版本或 SHA256 不匹配，工具会停止；不会尝试把相邻版本补丁强行应用。已有 `.local` 时也会停止，避免覆盖原始备份。

### 2. 退出 Docker 并安装

先保存工作，退出 Docker Desktop，确认托盘程序和后台均已退出。也可使用 `docker desktop stop --timeout 30`，但遇到退出超时应先处理退出问题。

在项目目录打开**管理员 PowerShell**：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

安装成功后，从开始菜单正常打开 Docker Desktop。脚本不自动启动数据库或容器。

### 3. 恢复原版

完整退出 Docker Desktop，然后在管理员 PowerShell 执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Restore
```

恢复需要保留 `.local\backup`，且安装版本仍与备份对应。Docker 更新后不要强行使用旧补丁或旧备份。

## 什么会保留原文

日志、终端、代码编辑区、用户输入、表格数据和明确标识的容器/镜像/数据卷名称不参与翻译。品牌名和编程语言名称按需保留。该边界经过模拟 DOM 检查，但仍欢迎提交实际页面的误翻译问题。

运行时翻译只读取本地词库，不联网翻译，不上传日志、账号、数据库、用户输入或 API 密钥。这描述的是本工具，不会改变 Docker 原有网络行为。

## 开发与贡献

```powershell
npm ci --ignore-scripts
npm test
npm run build:runtime
```

编辑 `locales/zh-CN.json` 补充译文；保留 `{0}` 等动态占位符。MCP 的 profile 统一用“配置方案”，Docker image 用“镜像”，client 用“客户端”。请附带原文、中文建议、Docker 版本和脱敏页面截图。

支持其他版本前，需核对原版文件、渲染入口、完整性摘要布局，并实际验证安装、恢复和页面。不要仅修改版本号或校验值就宣称支持。

## 发布与许可

发布流程见 [GitHub 发布指南](docs/PUBLISHING.md)。提交源码、词库和测试即可；**不要上传 `.local`、`dist`、node_modules、程序备份、Docker 安装文件或个人日志**。

GPL-3.0-only；上游来源与贡献说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。与 Docker, Inc. 无隶属或背书关系。

## 启动故障

如出现 `dockerInference` / `The file cannot be accessed by the system`，不要恢复出厂。参见 [已知限制和故障排查](docs/TROUBLESHOOTING.md)。该问题与正常重启后的 Windows 本地通信节点有关，不能仅凭错误窗口认定是中文用户名或汉化文本导致。
