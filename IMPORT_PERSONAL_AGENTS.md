# 个人 AGENTS.md 导入入口

本文件是给另一台电脑上的 AI 代理阅读的安装说明。待导入的个人全局规则位于 [`personal-agents/AGENTS.md`](personal-agents/AGENTS.md)。

推荐对代理这样说：

> 请参考 `IMPORT_PERSONAL_AGENTS.md`，将本仓库的个人全局 AGENTS.md 引入当前 Codex 环境。

## 代理执行要求

1. 以本文件所在目录作为仓库根目录，源文件固定为 `personal-agents/AGENTS.md`。
2. 确认 Codex Home：设置了 `CODEX_HOME` 时使用该目录，否则使用 `$HOME/.codex`。目标文件是 `<Codex Home>/AGENTS.md`。
3. 导入前检查 `<Codex Home>/AGENTS.override.md`：
   - 不存在或为空时继续；
   - 存在非空内容时先报告，因为它会遮蔽同级 `AGENTS.md`；未经用户确认不得修改或删除它。
4. 处理目标 `AGENTS.md`：
   - 不存在时复制完整源文件；
   - 内容完全相同时报告为已存在；
   - 内容不同时展示简洁差异并询问用户选择“合并”或“替换”，不得静默覆盖。
5. 合并时保留目标文件中不冲突的个人规则，每项含义只保留一个权威版本。项目专属规则应留在项目仓库自己的 `AGENTS.md`，不要并入全局文件。
6. 保留 `$HOME` 等可移植路径表达，不要把它改写为当前电脑用户名对应的绝对路径。
7. 完成后确认目标文件非空，并报告源文件、目标文件、导入方式以及 `AGENTS.override.md` 是否影响加载。
8. 提醒用户新开一个 Codex 会话进行验证；Codex 在每次新运行时重新构建全局与项目指令链。

## 验证提示

在新会话中让 Codex 概括当前加载的全局工作约定。只有当它能识别开发阶段、显式上库前检视、复杂功能的真实运行验证、黄蓝 Skill 路由和 pnpm 代理处理规则时，导入才算完成。

个人 Skill 使用独立入口 [`IMPORT_PERSONAL_SKILLS.md`](IMPORT_PERSONAL_SKILLS.md) 导入。
