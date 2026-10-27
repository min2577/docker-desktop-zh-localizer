# 发布到 GitHub

建议仓库名：`docker-desktop-zh-localizer`。仓库介绍可写：

> 非官方 Docker Desktop 中文化工具：本地词库、动态界面翻译、版本校验及原版恢复。实验性源码项目。

## 发布前检查

1. 实际检查主导航、容器、镜像、数据卷、MCP、设置及常用弹窗，并验证恢复原版。当前源码仅完成自动化和本机原版文件生成验证，仍有人工验收缺口。
2. 运行 `npm ci --ignore-scripts`、`npm test`。
3. 运行 `git status --short` 和 `git ls-files`。确认没有程序文件、个人路径、凭据、日志、数据库、截图账号信息和 `.local`。
4. 保留 GPL 许可与 DDCS 来源。核对 Docker 的适用条款，不能把“源码开源”描述成“官方授权中文版”。

## 登录并创建公开仓库

在本项目目录中，先由账号本人完成浏览器登录：

```powershell
gh auth login --hostname github.com --web
```

核对 `git config user.name` 和 `git config user.email`；公开提交会包含作者信息，建议在 GitHub 账号设置中选择自己的 noreply 提交邮箱。如果本地仓库尚无提交，先提交已审查的源码：

```powershell
git add .
git diff --cached --check
git commit -m "Initial experimental Chinese localization tool"
```

确认本地提交内容后：

```powershell
gh repo create docker-desktop-zh-localizer --public --source . --remote origin --push
```

这条命令会把提交公开上传到当前登录账号。请先检查当前账号和全部待上传文件。若仓库名已存在，先核对归属，不覆盖现有项目。

也可在 GitHub 网页中新建同名 Public 仓库，把源码压缩包解压后上传项目文件。不要只上传 ZIP，也不要上传 `.git`、node_modules、`.local` 或 `dist`。

## 发布 Alpha

完成实际验收后可以创建 `v0.1.0-alpha.1` 的预发布版本（Pre-release），说明仅支持 Windows x64 的特定 4.68.0 构建、数字签名影响、恢复方法及尚未验证的页面。

第一版使用 GitHub 自动生成的 Source code 源码下载即可，不上传本机生成的汉化 EXE、ASAR 或 Docker 的安装包。用户通过官方原版文件在本地生成补丁。

版本更新时，保留旧版本支持记录。GitHub Actions 的自动化通过不等于用户环境安装/恢复或真实页面验收通过。
