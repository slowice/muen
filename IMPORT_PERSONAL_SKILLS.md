# 个人 Skill 导入入口

本文件是给另一台电脑上的 AI 代理阅读的安装说明。仓库中的个人 Skill 以 [`personal-skills/`](personal-skills/) 为唯一来源。

个人全局 `AGENTS.md` 使用独立入口 [`IMPORT_PERSONAL_AGENTS.md`](IMPORT_PERSONAL_AGENTS.md) 导入。

推荐对代理这样说：

> 请参考 `IMPORT_PERSONAL_SKILLS.md`，将本仓库 `personal-skills/` 中的 Skill 引入当前 Codex 环境。

如果只需要部分 Skill，请在同一句话中列出名称。没有指定名称时，默认导入本仓库中的全部 Skill。

## 代理执行要求

1. 以本文件所在目录作为仓库根目录，不根据终端当前目录猜测源文件位置。
2. 枚举 `personal-skills/*/SKILL.md`；只有包含 `SKILL.md` 的一级子目录才是待导入 Skill。
3. 确认当前代理实际使用的个人 Skill 目录：
   - 设置了 `CODEX_HOME` 时，使用 `$CODEX_HOME/skills`；
   - 未设置时，优先使用当前 Codex 已在使用的个人 Skill 目录；全新环境默认使用 `$HOME/.agents/skills`；
   - 不要把同一个 Skill 同时安装到多个会被当前 Codex 扫描的目录，以免重复出现。
4. macOS 或 Linux 上，如果本仓库会保留在稳定路径，优先为每个 Skill 建立指向源目录的软链接；仓库路径可能变化或系统不便创建软链接时，复制完整目录。
5. 遇到同名目标时先比较：
   - 已指向本仓库同一源目录的软链接可以保留或刷新；
   - 内容完全相同的目录可以报告为已存在；
   - 目标包含不同内容时停止该项并向用户报告，未经确认不得覆盖。
6. 保留每个 Skill 的完整目录结构，包括 `agents/`、`assets/`、`references/` 和 `scripts/`。不要安装 Codex 自带的 `.system` Skill。
7. 使用当前环境可用的 Skill 校验器逐个校验；没有校验器时，至少确认目录名与 `SKILL.md` 的 `name` 一致，并且 frontmatter 同时包含 `name` 和 `description`。
8. 导入完成后报告：源仓库绝对路径、实际安装目录、每个 Skill 的安装方式和校验结果。若 Codex 未立即发现新 Skill，提醒用户重启 Codex。

## 当前 Skill 清单

| Skill | 用途 |
| --- | --- |
| `blue-yellow-development-loop` | 蓝区改代码、黄区验证真实环境时的诊断与交接循环 |
| `coding-executor` | Coding 执行器子进程与 AskQuestion 交互测试 |
| `crud-mybatis-tdd` | Java/MyBatis CRUD 的测试驱动实现 |
| `matrix-real-scenario-testing` | MatrixAssistant Electron/Gateway 真实场景验证 |
| `onboard-new-user` | Codex 新用户引导 |
| `pre-submit-code-review` | 上库前增量检视与质量门禁 |
| `query-poe-currency-price` | 查询 PoE 官方通货成交历史与兑换比例 |
| `refresh-poe-unique-prices` | 刷新 PoE Standard 传奇价格、粉尘与来源工作簿 |
| `resolve-mr-conflicts` | 处理 fork 模式合并请求冲突 |
| `summarize-latest-problem` | 总结对话中最近一个完整问题弧 |

## 完成标准

只有当所有请求导入的 Skill 都被列为“已安装”或“内容相同、已存在”，且逐个通过结构校验时，导入才算完成。冲突、缺失文件或校验失败必须单独列出，不得笼统声称导入成功。
