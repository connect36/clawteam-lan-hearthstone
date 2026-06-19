# 酒馆战棋模式 AI 开发手册

## 0. 文档用途

这份文档用于给后续 AI 直接接手酒馆战棋模式开发。

它同时覆盖四类信息：

- 已确认的产品需求
- 当前代码层面的实际进展
- 已经创建的 ClawTeam 团队与任务板
- 当前明确存在的阻塞与建议的下一步

更新时间：

- 2026-04-21

## 1. 当前状态快照

### 已完成

- 已确认酒馆战棋模式的 MVP 范围与约束
- 已创建独立路由 `/?mode=battlegrounds`
- 已在主页面增加 `酒馆战棋 MVP` 入口
- 已接入战棋模式的独立 UI 外壳
- 已接入英雄选择占位区、招募阶段占位区、战斗承接位、日志区
- 已创建 ClawTeam 团队 `bg-s12-mvp`
- 已创建 Manager / A1 / A2 / Reviewer B 的任务拆分

### 当前尚未完成

- 真实的 S12 赛季末英雄池数据
- 真实的 S12 海盗 / 元素 / 酒馆法术池
- 招募阶段正式引擎
- 自动战斗正式引擎
- AI 招募与站位逻辑
- 淘汰 / 出局与排名结算

### 当前最大阻塞

- ClawTeam 团队和任务板已经建好
- 但本机的子 agent CLI 调用链路还不稳定，导致 worker 没有稳定产出
- 因此目前只有 Manager 侧完成了入口壳子与路由接线

## 2. 已完成的代码接线

### 已新增文件

- `AI_BATTLEGROUNDS_MVP_PLAN.md`
  - 本文档，作为战棋模式 handoff + plan
- `public/battlegrounds-view.js`
  - 战棋模式独立视图壳子
- `public/battlegrounds.css`
  - 战棋模式独立样式

### 已修改文件

- `public/index.html`
  - 新增 `酒馆战棋 MVP` 模式入口按钮
  - 引入 `battlegrounds.css`
- `public/app.js`
  - 新增 `battlegrounds` 模式状态
  - 新增 `updateAppUrl('battlegrounds')`
  - 新增 `startBattlegroundsMode()`
  - 新增占位英雄选择 / 商店预览 / 冻结预览 / 日志逻辑
  - 在全局 `render()` 中接入战棋模式分支

### 当前实现的真实含义

当前代码并没有实现“可玩的正式战棋玩法”。

当前实现只是把下面这些承接位先铺好了：

- 新模式入口
- 独立路由
- 独立页面外壳
- 顶层状态对象
- 最小交互骨架

后续 A1 / A2 或其他 AI 需要把真实的数据、招募逻辑、战斗逻辑、AI 逻辑继续挂到这些承接位上。

## 3. 已做过的验证

### 语法检查

- `node --check public/app.js`
- `node --check public/battlegrounds-view.js`

两项都已通过。

### 本地服务验证

曾用以下命令做过最小冒烟验证：

```bash
PORT=3303 npm start
```

已确认：

- `/?mode=battlegrounds` 页面可被服务
- 页面中能看到 `battlegrounds.css`
- 页面中能看到 `酒馆战棋 MVP` 入口
- `/api/healthz` 返回正常

## 4. ClawTeam 当前状态

### 团队信息

- Team name: `bg-s12-mvp`
- Team role layout:
  - `manager`
  - `a1`
  - `a2`
  - `b`

### 看板入口

本地看板已经启动过，当前约定入口为：

- [http://127.0.0.1:8080](http://127.0.0.1:8080)

如果后续失效，可重新启动：

```bash
source /Users/ruiliu/.venvs/clawteam/bin/activate
clawteam board serve bg-s12-mvp -p 8080
```

### 已建任务

- `c1d53896`
  - `Build battlegrounds data and recruit engine skeleton`
  - owner: `a1`
- `7ed27638`
  - `Build battlegrounds combat and AI skeleton`
  - owner: `a2`
- `76d185bf`
  - `Review first battlegrounds module delivery`
  - owner: `b`
  - blocked by: `c1d53896`, `7ed27638`

### 当前实际问题

#### 问题 1：`codex` 默认 subprocess 调用不兼容

- 这版 `clawteam` 直接把 `codex` 当成旧式 prompt 命令来拉起
- 本机 `codex` CLI 的正确非交互方式实际上更接近 `codex exec`
- 直接 spawn 后子进程会快速退出

#### 问题 2：尝试过包装脚本，但链路仍不稳定

为兼容 `clawteam`，本机新增过一个包装脚本：

- `/Users/ruiliu/.clawteam/bin/codex-exec-wrapper.sh`

这个脚本已经修正过：

- `clawteam` 额外注入的 `-p`
- `codex exec` 的参数结束符 `--`

但 `codex exec` 的非交互链路在本机依然会出现不稳定重试，因此仍未形成稳定 worker 产出。

#### 问题 3：切到 `openclaw` 也没有稳定留下来

- 本机存在 `openclaw`
- `clawteam` 也会把它标准化为 `openclaw agent --local --session-id ... --message ...`
- 但当前仍然没有得到稳定的持续 worker 输出

### 结论

ClawTeam 的“团队、任务板、工作区、看板”都已成功建好。

当前失败的不是任务拆分，而是“本机 agent runner 的稳定执行”。

## 5. 后续 AI 的最优先顺序

### 路线 A：先修复 ClawTeam runner

如果目标是继续保持多 agent 协作，建议优先做：

1. 验证 `codex exec` 在当前机器上的稳定非交互运行方式
2. 重新适配 `clawteam` 的 worker command
3. 确认 A1 / A2 / B 能稳定更新任务状态、提交工作、发回 inbox
4. 再让团队继续正式开发

### 路线 B：暂时绕过 ClawTeam runner，直接本地实现

如果目标是尽快推进功能，建议直接按本文档的拆分继续在主工作区实现：

1. `public/battlegrounds-data.js`
2. `public/battlegrounds-engine.js`
3. `public/battlegrounds-combat.js`
4. `public/battlegrounds-ai.js`
5. 回到 `public/app.js` 做正式集成

这条路线会更快，但会暂时失去本轮 ClawTeam 的并行优势。

### 当前更推荐

如果只考虑推进速度，当前更推荐路线 B。

原因是：

- 路由与页面壳子已经打通
- 真实阻塞不在业务设计，而在本机 agent 运行链路
- 继续卡在 runner 上，性价比不高

## 6. 未来 AI 需要记住的硬约束

- 第一阶段先不做淘汰 / 出局
- 生命值归零先按占位规则处理，最低钳制到 `1`
- 第一阶段英雄技能统一禁用
- 第一阶段先只做海盗、元素两个种族
- 第一阶段优先玩法正确性，不追求完整赛季全池子一次到位
- 所有已接入的官方内容必须尽量使用官方卡名、描述、数值

## 7. 已确认目标

- 目标玩法：尽量还原官方《酒馆战棋》
- 第一阶段目标：先做可玩的 MVP
- 入口形式：新增独立路由 `/?mode=battlegrounds`
- 平台优先级：单机优先
- 对局结构：单人进入 8 人标准酒馆战棋流程，对手为 7 个 AI
- UI 方向：为战棋模式设计独立界面
- 优先级：玩法正确性高于界面完整度

## 8. 第一阶段范围

### 必做

- 新模式入口与独立路由
- 8 人单机战棋基础对局框架
- 英雄选择入口
- 完整英雄池与护甲系统
- 招募阶段基础流程
- 官方节奏的金币、升本、刷新、冻结、买卖、站位
- 三连合成金色
- 高一本发现逻辑
- 回合计时器
- 自动战斗动画
- 简易 AI 招募逻辑
- 海盗、元素两个种族作为第一批可玩种族
- 酒馆法术第一版尽量补到可玩的赛季末对应集合

### 战斗阶段第一版必须覆盖

- 基础攻击顺序
- 嘲讽目标限制
- 圣盾
- 复生
- 亡语
- 召唤位置
- 满场处理
- 攻击目标选择尽量对齐官方

### 明确延后

- 英雄技能
- 淘汰 / 出局
- 结算名次
- 存档
- LAN 多人
- 更高精度的完整战斗复刻
- 扩展到更多种族
- 编辑器适配战棋数据

## 9. 当前 MVP 的执行约束

### 数据约束

- 随从、酒馆法术、金色规则都以 S12 赛季末为来源
- 第一版允许先做“官方赛季末来源中的可玩子集”
- 第一版所有已接入内容都必须使用官方卡名、描述、数值
- 非本阶段池子内容禁止混入

### 玩法约束

- 先使用 8 人标准对局节奏，不退化为单 AI 对练模式
- 由于本阶段暂不做淘汰/出局，生命值归零后的处理先采用占位规则
- 默认占位规则：生命值最低保留到 `1`，玩家和 AI 不会被移出对局
- 配对、招募、战斗、下一回合循环必须能持续推进

### 代码约束

- 尽量把战棋逻辑拆到新模块，不把全部逻辑继续塞进现有 `public/app.js`
- 集成层允许少量修改现有入口文件
- 现有 PvP / Solo 逻辑不能被战棋模式破坏

## 10. 建议架构

### 前端入口层

- `public/app.js`
  - 继续做全局路由与模式切换
  - 新增 `battlegrounds` 模式识别
  - 只保留入口接线与顶层事件转发

### 新增战棋模块

- `public/battlegrounds-data.js`
  - 英雄池
  - S12 赛季末海盗、元素、相关中立可玩子集
  - 酒馆法术数据
  - Tavern Tier 与池子配置

- `public/battlegrounds-engine.js`
  - 对局状态结构
  - 招募阶段状态流转
  - 金币、升本、刷新、冻结、买卖、三连、发现
  - 配对信息与回合推进

- `public/battlegrounds-combat.js`
  - 战斗队列
  - 攻击目标选择
  - 亡语 / 复生 / 圣盾 / 嘲讽 / 召唤位置
  - 动画事件流

- `public/battlegrounds-ai.js`
  - MVP 级 AI 招募与站位逻辑
  - 按 tavern tier、金币、种族倾向作简单决策

- `public/battlegrounds-view.js`
  - 战棋专用界面渲染
  - 英雄选择、酒馆商店、玩家棋盘、对手信息、计时器、战斗播报

### 样式层

- `public/styles.css`
  - 仅补充战棋模式入口级样式或共享变量

- 可选新增 `public/battlegrounds.css`
  - 承载战棋模式主体样式，降低对现有界面的污染

## 11. 推荐状态模型

```js
state.battlegrounds = {
  phase: 'hero-select' | 'recruit' | 'combat' | 'result',
  round: 1,
  timer: {
    totalMs: 0,
    endsAt: 0,
  },
  heroChoices: [],
  players: [
    {
      id: 'player',
      isHuman: true,
      heroId: '',
      armor: 0,
      health: 40,
      tavernTier: 1,
      tavernUpgradeCost: 5,
      gold: 3,
      board: [],
      hand: [],
      shop: [],
      frozen: false,
      discoveredCards: [],
      spells: [],
      triples: [],
    }
  ],
  pool: {
    minionsByTier: {},
    tavernSpellsByTier: {},
  },
  matchmaking: {
    pairs: [],
  },
  combat: {
    activePairIndex: 0,
    log: [],
    animationQueue: [],
  },
}
```

## 12. 第一阶段里程碑

### M1 路由与骨架

- 主页能够进入 `/?mode=battlegrounds`
- 能看到独立 UI 外壳
- 能进行英雄三选一
- 能启动一局 8 人单机对局

### M2 招募阶段闭环

- 酒馆展示
- 刷新、冻结、买入、卖出、升本
- 手牌与棋盘操作
- 三连金色
- 高一本发现
- 计时器推进

### M3 战斗阶段闭环

- 8 人配对到 1v1 战斗
- 自动攻击与动画播报
- 亡语 / 复生 / 圣盾 / 嘲讽 / 召唤位置 / 满场逻辑
- 一场战斗结束后能回到下一轮招募

### M4 MVP 可玩化

- 简易 AI 能完成招募与站位
- 海盗、元素形成基础可玩构筑
- 酒馆法术接入到可玩程度
- 不做淘汰，但对局能持续数轮验证核心循环

## 13. ClawTeam 拆分

### Manager

- 负责需求约束、设计文档、任务编排、敏感文件集成
- 负责修改已有高风险文件：
  - `public/app.js`
  - `public/index.html`
  - `public/styles.css`

### Worker A1

- 负责新增数据与招募阶段核心引擎
- 主要写入：
  - `public/battlegrounds-data.js`
  - `public/battlegrounds-engine.js`

### Worker A2

- 负责新增战斗与 AI 模块
- 主要写入：
  - `public/battlegrounds-combat.js`
  - `public/battlegrounds-ai.js`

### Reviewer B

- 只做 review
- 重点关注：
  - 三连 / 发现是否有规则漏洞
  - 招募阶段状态是否会错乱
  - 战斗结算是否会出现死循环、满场异常、复生异常
  - 与现有 Solo / PvP 的耦合风险

## 14. 初始任务板

### 任务 1

- 标题：建立战棋模式数据骨架
- Owner：A1
- 目标：先把 S12 赛季末海盗 / 元素 MVP 数据结构、英雄池与 tavern tier 配置固化成可读取模块

### 任务 2

- 标题：建立战棋战斗与 AI 骨架
- Owner：A2
- 目标：先把战斗循环、事件日志、目标选择与简易 AI 接口骨架搭起来

### 任务 3

- 标题：集成新模式入口与独立界面
- Owner：Manager
- 目标：在不破坏现有模式的前提下接入新路由、状态切换和战棋 UI 容器

### 任务 4

- 标题：首轮 review
- Owner：B
- 目标：在 A1 / A2 交付第一批模块后检查规则缺口与集成风险

## 15. 当前默认假设

- 若生命值应降到 `0` 或以下，第一阶段先钳制为 `1`
- 英雄选择先保留完整英雄池与护甲值，但英雄技能统一禁用
- 第一阶段的“完整英雄池”允许头像与文本占位，只要英雄名与护甲准确
- 酒馆法术优先接通系统，再逐步补齐赛季末对应集合

## 16. 完成标准

满足以下条件即可视为第一阶段 MVP 达标：

- 能进入 `/?mode=battlegrounds`
- 能开始一局单机 8 人战棋
- 能完成英雄选择
- 能进行招募阶段核心操作
- 能进行自动战斗并看到动画与日志
- 能从一轮招募进入战斗，再回到下一轮招募
- 不要求淘汰、排名与最终结算
