# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

DailyHotApi 是一个聚合热门数据的 API 接口，从 50+ 数据源（微博、哔哩哔哩、知乎、抖音等）抓取热榜数据，支持 JSON 和 RSS 两种输出格式。

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化，无缓存）
npm run dev

# 开发模式（监听文件变化，有缓存）
npm run dev:cache

# 编译 TypeScript
npm run build

# 运行编译后的代码
npm run start

# 格式化代码
npm run format

# 代码检查
npm run lint

# PM2 部署
sh ./deploy.sh
```

## 架构设计

### 核心技术栈

- **框架**: Hono（轻量级 Web 框架）+ Node.js 服务适配器
- **语言**: TypeScript，ESM 模块
- **缓存**: 双层缓存机制，NodeCache（内存）+ 可选 Redis

### 关键文件

- `src/index.ts` - 入口文件，启动 Hono 服务器
- `src/registry.ts` - 自动发现并注册 `src/routes/` 下的所有路由
- `src/config.ts` - 从环境变量读取配置
- `src/types.d.ts` - TypeScript 类型定义

### 路由系统

路由通过扫描 `src/routes/*.ts` 自动注册。每个路由文件必须导出：

```typescript
export const handleRoute = async (c: ListContext, noCache: boolean): Promise<RouterData>
```

文件名即为 API 路径（如 `bilibili.ts` → `/bilibili`）。

### 标准路由响应结构

```typescript
interface RouterData {
  name: string;           // 路由标识
  title: string;          // 显示名称
  type: string;           // 榜单类型描述
  description?: string;   // 可选描述
  params?: Record<string, object>;  // 可用查询参数
  link?: string;          // 源站链接
  total: number;          // 数据条数
  updateTime: string;     // ISO 时间戳
  fromCache: boolean;     // 是否来自缓存
  data: ListItem[];       // 榜单数据数组
}

interface ListItem {
  id: number | string;
  title: string;
  cover?: string;
  author?: string;
  desc?: string;
  hot: number | undefined;
  timestamp: number | undefined;
  url: string;
  mobileUrl: string;
}
```

### 数据请求

使用 `src/utils/getData.ts` 中的 `get()` 或 `post()` 发起 HTTP 请求：
- 自动处理缓存（先查缓存，再存储响应）
- 支持 `noCache` 参数绕过缓存
- 支持自定义 TTL

### 缓存层

`src/utils/cache.ts` 提供：
- `getCache(key)` - 优先查 Redis，回退到 NodeCache
- `setCache(key, value, ttl)` - 同时写入 Redis 和 NodeCache
- `delCache(key)` - 从两个存储中删除

Redis 连接是惰性的且可选，系统可仅使用 NodeCache 运行。

## 配置说明

复制 `.env.example` 为 `.env`，主要配置项：

- `PORT` - 服务端口（默认 6688）
- `CACHE_TTL` - 缓存时长，秒（默认 3600）
- `REQUEST_TIMEOUT` - HTTP 超时，毫秒（默认 6000）
- `REDIS_*` - 可选的 Redis 连接配置
- `RSS_MODE` - 默认返回 RSS 而非 JSON

## API 查询参数

所有路由支持：
- `?cache=false` - 绕过缓存
- `?limit=N` - 限制返回条数
- `?rss=true` - 返回 RSS XML 格式

## 新增路由步骤

1. 创建 `src/routes/{name}.ts`
2. 导出 `handleRoute(c: ListContext, noCache: boolean)` 返回 `RouterData`
3. 使用 `getData.ts` 中的 `get()`/`post()` 发起请求
4. 将响应数据映射为 `ListItem[]` 格式
5. 路由自动注册到 `/{name}`
