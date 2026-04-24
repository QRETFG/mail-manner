# 邮箱收藏管理系统

一个基于 Next.js、Prisma 和 SQLite 的全栈邮箱地址收藏管理系统，支持本地账号登录、邮箱收藏 CRUD、分类管理、检索筛选、批量操作、CSV/JSON 导入导出。

## 快速开始

```bash
npm install
npm run prisma:push
npm run dev
```

打开 http://localhost:3000 后注册账号即可使用。

## 常用命令

- `npm run dev`：启动开发服务
- `npm run build`：生成 Prisma Client 并构建生产版本
- `npm run typecheck`：TypeScript 检查
- `npm test`：运行单元测试
- `npm run prisma:push`：同步 SQLite 数据库结构

## Docker 部署

Ubuntu 云服务器安装 Docker 和 Docker Compose Plugin 后，可直接使用本项目根目录的 `docker-compose.yml` 部署。

```bash
cp .env.docker.example .env.docker
openssl rand -base64 48
```

把生成的随机字符串填入 `.env.docker` 的 `AUTH_SECRET`，然后启动服务：

```bash
docker compose --env-file .env.docker up -d --build
```

部署后访问 `http://服务器IP:3000`。SQLite 数据库会保存到宿主机 `./data/app.db`，容器重建后数据不会丢失。

常用维护命令：

```bash
docker compose --env-file .env.docker logs -f
docker compose --env-file .env.docker restart
docker compose --env-file .env.docker down
```

如果服务器使用防火墙，请放行 `3000` 端口，或在 Nginx/Caddy 中反向代理到 `127.0.0.1:3000`。

如果构建时报 `x509` 证书错误，且证书域名不是 Docker Hub，例如拿到 Facebook 证书，通常是服务器 DNS、代理或运营商网络劫持导致，并非项目 Dockerfile 问题。可先在服务器检查：

```bash
date
curl -Iv https://registry-1.docker.io/v2/
docker pull node:22-bookworm-slim
```

若 `docker pull` 同样失败，请修复服务器 DNS/代理，或在 `.env.docker` 中指定可访问的 Node 镜像源：

```bash
NODE_IMAGE=你的镜像源/library/node:22-bookworm-slim
docker compose --env-file .env.docker up -d --build
```

## 功能

- 收藏邮箱地址，记录显示名、分类、备注和星标状态。
- 按关键词、分类、星标筛选邮箱收藏。
- 管理分类，例如 `Google`、`Outlook`、`QQ`、`公司邮箱`。
- 批量星标、取消星标、移动分类和删除。
- 导入导出 CSV/JSON，方便备份和迁移。

## 导入格式

CSV 表头：`email,displayName,category,note,isStarred`。

JSON 使用收藏对象数组，字段与 CSV 表头一致。导入时分类不存在会自动创建，重复邮箱地址会跳过。
