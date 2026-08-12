# BaziGo 黄金用例生成步骤

BaziGo 是独立 Go 仓库。本仓库不引入 Go 运行时依赖，也不修改或迁移 BaziGo。

**fixture 已入库**（`core/calendar/__tests__/fixtures/bazigo-golden.json`，59 条），交叉校验在任何机器上都会执行，不再需要本机存在 BaziGo。下面的步骤用于**重新生成或扩充**样本。

## 重新生成

1. 在仓库外新建一个临时 Go module，用 `replace` 指向本机 BaziGo 路径，避免改动 BaziGo：

```
module bazigogen
go 1.16
require github.com/warrially/BaziGo v0.0.0
require github.com/yangtizi/htmlgo v1.0.0
replace github.com/warrially/BaziGo => /path/to/BaziGo
```

把 BaziGo 的 `go.sum` 原样复制过去，`GOPROXY=off go build -C <dir>` 即可离线构建。

2. 入口调用 `bazi.GetBazi(y, mo, d, h, mi, 0, 1)`，取 `SiZhu().YearZhu()/MonthZhu()/DayZhu()/HourZhu()` 的 `GanZhi().String()`。
3. 取样点用本仓库的 `jieqiTable(year)` 生成 —— 在每个「节」的精确时刻 ±1 分钟各取一条。用自己的节气表挑取样位置不影响对照的独立性：比对结果仍来自 BaziGo。
4. 结果写入 `core/calendar/__tests__/fixtures/bazigo-golden.json`，运行 `npx jest golden-bazigo`。
5. 若出现新差异，**先查明原因再决定归属**：属本仓库缺陷就修代码，属实现口径差异就在该条用例的 `差异` 字段记录 `{ 字段, 本仓库, 原因 }`。**不得为了让测试变绿而直接抄 BaziGo 的值。**

样本至少 20 条，覆盖：立春前后、12 个节前后、23:00 至 01:00 换日区间、闰月。

## 对照口径（必须对齐，否则会把口径差异误判成算错）

BaziGo 只接受民用年月日时分秒：**不做真太阳时校正**，也没有经度参数；日柱由 `genDayGanZhi(GetAllDays())` 直接取公历日，**等价子夜换日**。所以每条用例都显式带：

```json
{ "useTrueSolar": false, "dayBoundary": "00:00" }
```

**经度与真太阳时不在本组校验范围内。** BaziGo 无法充当该维度的基准，那部分由 `truesolar` 与 `pillars` 自身的测试锁定。原先要求「覆盖乌鲁木齐经度」在这个 oracle 下无法满足，不要用本组测试冒充真太阳时已被外部验证。

入参一律用 `parseCivilDateTime` 构造民用墙钟值，**不要用 `new Date(ISO字符串)`** —— 后者会被运行机器的时区与历史夏令时改写（例如 1990 年 6 月中国处于 UTC+9，`00:00+08:00` 会被读成 01:00，时柱由子变丑）。

## 已查明的差异（6 条，全部在 23:00 之后的时柱）

BaziGo 的日柱取公历日（子夜换日），但时干按子时进位取**次日**日干，两种口径混用。本仓库在 `dayBoundary: '00:00'` 下保持自洽：日柱与时干都取同一日。

| 时刻 | 本仓库 | BaziGo |
|---|---|---|
| 1990-06-15 23:00 | 日 辛亥 → 时 戊子 | 日 辛亥 → 时 庚子 |

这 6 条用例仍然断言本仓库取值等于 `差异.本仓库`，使已知差异被钉死，不会悄悄漂移。

## 这组基准抓出的缺陷

首次运行时 59 条里有 30 条不一致，查明为本仓库缺陷并已修复：历法库的 `getMonthInGanZhi()` 与 `getYearInGanZhiByLiChun()` **在节气所在日的零点就切换，而不是在节气精确时刻**。2024 立春在 16:27:07，它在当日 00:00 就已给出 `甲辰 丙寅`，提前 16.5 小时。节气当天、精确时刻之前出生的人会拿到错误月柱，立春当天还会错年柱，并顺带污染十神、格局与大运。

修复见 `core/calendar/pillars.js` 的 `yearMonthPillars()`：年柱以立春精确时刻为界，月柱以十二「节」精确时刻为界，五虎遁推月干；日柱仍用历法库。原先的边界测试只在相隔数日取样（2 月 3 日 vs 2 月 5 日），日粒度切换也能通过，所以没抓到 —— 现已补上分钟级的节前后断言。
