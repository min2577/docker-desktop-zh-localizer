# 来源与许可

## DDCS

- 项目：[asxez/DDCS](https://github.com/asxez/DDCS)
- 来源提交：`9c3d2181e16dbed8474ec4538a8cbcf8eda51f33`
- 源码归档 SHA256：`3a0144e71cb6c4847608b3a243340df865dfd5aa3bf9b5abf38bd959171480b0`
- 获取日期：2026-10-27。
- 许可：GNU GPL version 3；项目按 GPL-3.0-only 发布。
- 上游作者/版权：ASXE 及上游贡献者；保留上游版权与来源，不声称全部译文为本项目原创。

`locales/zh-CN.json` 的基础译文来自上游 `lib/extract_config.py`。对应的源码文件和数据结构保存在 `third_party/ddcs`，完整 GPL 文本见根目录 `LICENSE`。当前工具不调用上游 Python 修改脚本，仅复用词库。

补充部分来自 Docker 公开客户端静态界面文案的机器初译、术语统一及人工校正；运行时无在线翻译请求。初译未使用用户日志、数据库或凭据。部分译文仍需社区校对。

本项目新增加的本地翻译层、打包工具、安装恢复脚本及测试同样按 GPL-3.0-only 提供。

## 依赖

`@electron/asar`、`chromium-pickle-js`、`jsdom` 及其间接依赖通过 npm 安装，未将 node_modules 放入源码仓库。具体版本和来源见 `package-lock.json`；各依赖许可保留在其发行包中。

## Docker

Docker Desktop、其程序文件、图标和商标不属于本项目开源许可范围。源码仓库不包含 Docker 安装程序、原始或修改后的 EXE/ASAR，也不提供 Docker 许可证。本工具自身开源不等于取得修改或分发 Docker 的授权；使用、修改及对外发布前需核对适用条款与授权。
