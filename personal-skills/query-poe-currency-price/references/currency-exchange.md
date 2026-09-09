# Currency Exchange 参考

## 官方文档

- API Reference：`https://www.pathofexile.com/developer/docs/reference#currencyexchange`
- PoE 1 PC：`https://web.poecdn.com/api/currency-exchange/<change_id>`
- Xbox：`https://web.poecdn.com/api/currency-exchange/xbox/<change_id>`
- Sony：`https://web.poecdn.com/api/currency-exchange/sony/<change_id>`
- PoE 2：`https://web.poecdn.com/api/currency-exchange/poe2/<change_id>`

`change_id` 是按小时截断的 Unix 时间戳。响应中的 `next_change_id` 可用于顺序读取下一小时。

## 已验证 Metadata ID

| 物品 | Metadata ID |
|---|---|
| Chaos Orb | `Metadata/Items/Currency/CurrencyRerollRare` |
| Divine Orb | `Metadata/Items/Currency/CurrencyModValues` |
| Maven's Chisel of Proliferation | `Metadata/Items/Currency/CurrencyMapQualityPackSize` |

## 已确认与未确认

已确认：

- 响应按 `league` 区分联盟。
- `market_id` 和 `market_pair` 使用基础物品 Metadata ID。
- 数据包含小时成交量、库存范围和 ratio 范围。
- 当前小时不可获取。

未由官方文档定义：

- `lowest_ratio` 与 `highest_ratio` 的精确计算过程。
- 哪个字段代表买入价或卖出价。
- 当前订单簿的 bid/ask。
