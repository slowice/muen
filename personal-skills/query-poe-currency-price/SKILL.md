---
name: query-poe-currency-price
description: 使用 Path of Exile 官方 Currency Exchange 小时历史接口，按 Metadata ID 查询指定联盟通货的成交市场、成交量和兑换比例；用于核对通货价格或验证 poe.ninja，不用于查询传奇装备或声称获得当前买卖盘。
---

# 查询通货价格

使用官方公开接口查询已经结束小时的通货成交市场：

```text
GET https://web.poecdn.com/api/currency-exchange[/<realm>]/<change_id>
```

默认联盟为 `Standard`、平台为 PoE 1 PC、时间范围为最近一个完整小时。当前小时不可查询。

## 推荐执行方式

运行随技能提供的脚本：

```bash
node scripts/query_currency_exchange.mjs \
  --metadata-id Metadata/Items/Currency/CurrencyMapQualityPackSize \
  --league Standard \
  --hours 1
```

从技能目录以外执行时，使用脚本的绝对路径。可选参数：

- `--hours <1-168>`：从最近完整小时向前查询多少小时。
- `--realm <pc|xbox|sony|poe2>`：默认 `pc`。
- `--output <path>`：把结果保存为 JSON；省略时输出到标准输出。
- `--end-change-id <unix-hour>`：指定查询的最后一个完整小时；必须是 3600 的整数倍。
- `--help`：显示用法。

脚本输出每小时的完整匹配市场对象，包括 `volume_traded`、`lowest_stock`、`highest_stock`、`lowest_ratio` 和 `highest_ratio`，不会改写官方字段。

已确认的常用 Metadata ID 和接口语义见 [references/currency-exchange.md](references/currency-exchange.md)。

## 解读规则

- `market_pair` 的顺序按内部哈希排序，不代表买方和卖方。
- 官方文档没有把 `lowest_ratio`/`highest_ratio` 定义为买价/卖价，也没有 `bid`、`ask`、`buy`、`sell` 字段。
- 不得把两个 ratio 字段重命名为买入价和卖出价；交付时保留官方字段名。
- 单小时没有匹配记录，只能说明该 Metadata ID 在该联盟该小时没有返回市场活动，不能证明物品不存在或 ID 错误。
- 低成交量的直接 Chaos 比例可能是异常样本。需要估值时，同时检查成交量以及与 Divine Orb、Chaos Orb 的交叉换算，并清楚区分事实与推断。
- 此接口是历史小时摘要，不是当前订单簿，不能给出当前可立即成交的双边报价。

## 失败处理

- HTTP 非 200、JSON 解析失败或响应缺少 `markets` 时，报告具体小时和错误，不要伪造空市场。
- 多小时查询允许保留已经成功的小时，但最终必须列出失败小时。
- Metadata 名称映射必须来自已验证证据；不要根据英文含义随意拼接内部 ID。
