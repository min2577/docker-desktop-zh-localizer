# 已知限制与故障排查

## 汉化覆盖

此工具为实验版本，包含约 4,200 条词条。未知动态文案、第三方扩展、远程页面可能保持英文。保留代码、日志、用户数据和品牌名称不算完整页面文案的承诺。

运行时翻译层仅加入受支持版本的 dashboard 渲染入口。其他独立窗口和原生系统窗口尚未验证；Windows UAC 及操作系统对话框不属于本工具翻译范围。

## 本地通信节点故障（Windows error 1920）

如果后台报 `initializing Inference manager`、`dockerInference` 和 `The file cannot be accessed by the system`，先保留诊断信息，不要点击恢复出厂。

[Docker 问题报告 #531](https://github.com/docker/desktop-feedback/issues/531)描述了相似的 AF_UNIX 节点故障。本项目本机测试曾在重启后遇到此错误：通信节点为 0 字节 ReparsePoint，Windows 也无法查询它；保留改名仅含 socket 的父目录、让 Docker 重建后，引擎恢复。

涉及的运行时目录为 `%LOCALAPPDATA%\Docker\run` 和 `%LOCALAPPDATA%\docker-secrets-engine`。**不要据此清理整个 Docker 数据目录。** 只有确认同一错误、完全退出 Docker、核实目录本身不是重解析点且仅含对应运行时节点后，才考虑保留改名父目录。不能自动假设所有用户环境都相同。

本项目不会自动删除这些对象、关闭 AI、更改安全/隐私设置、重命名 Windows 用户或恢复出厂。恢复运行不等于底层故障已永久修复。请保留原版恢复能力，并向 Docker 报告对应版本的问题。

## 版本不匹配

拒绝生成或安装是预期行为。不要跳过 SHA256 校验、修改清单冒充支持或覆盖新的安装版本。

## 程序签名

资源摘要变化会让前端 EXE 的原始数字签名失效。如果系统或组织策略阻止运行，不要关闭防护或绕过策略；恢复原版并停止使用该补丁。
