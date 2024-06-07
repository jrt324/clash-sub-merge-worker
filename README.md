
# Clash Subscription Merge Worker

该项目可以部署到 Cloudflare Worker，用于将 Clash 订阅链接 与额外的代理节点和组进行合并。它从给定的 订阅链接URL 读取 YAML，注入指定的代理节点到现有节点中，并将这些节点添加到指定的分组中。

## 功能

- 从给定的 URL 获取 YAML 订阅文件。
- 将额外的代理节点注入到订阅中。
- 将注入的节点添加到指定的代理组。
- 返回修改后的 YAML 文件。

## 技术栈

- **TypeScript**
- **Cloudflare Workers**：用于运行 JavaScript 的无服务器平台。
- **YAML**：用于解析和序列化 YAML 文件。
- **Base64**：用于编码和解码 Base64 字符串。

## 安装

1. **克隆仓库：**

    ```bash
    git clone https://github.com/jrt324/clash-sub-merge-worker.git
    cd clash-sub-merge-worker
    ```

2. **安装依赖：**

    ```bash
    npm install
    ```

3. **安装 Wrangler CLI：**

    如果尚未安装 Wrangler CLI，请全局安装：

    ```bash
    npm install -g wrangler
    ```

## 配置

编辑 `wrangler.toml` 文件以匹配你的 Cloudflare 账户设置：

```toml
name = "clash-sub-merge-worker"
main = "src/index.ts"
compatibility_date = "2024-06-07"
```

## 开发调试和部署

### 本地开发

你可以使用 Wrangler 在本地运行并测试你的 Cloudflare Worker：

```bash
wrangler dev
```

这将启动一个本地开发服务器，地址为 `http://localhost:8787`。

### 部署

要将你的 Cloudflare Worker 部署到 Cloudflare 账户，请使用以下命令：

```bash
wrangler publish
```

## 使用

### API 端点

该 Worker 暴露了一个端点，接受以下查询参数：

- `subUrl`：YAML 订阅文件的 URL。
- `proxies`：Base64 编码的代理配置 JSON 数组。
- `groups`：Base64 编码的组及其对应代理的 JSON 数组。

### 示例请求

```bash
curl "https://your-worker-url.workers.dev?subUrl=<your_subscribe_url>&proxies=<base64_encoded_proxies>&groups=<base64_encoded_groups>"
```

### 推荐搭配UI编辑器
访问地址：https://clash-sub-convert-ui.pages.dev/

源码仓库：https://github.com/jrt324/clash-sub-convert-ui

### 参数示例：

#### proxies

代理配置的 JSON 数组：

```json
[
    {
        "name": "proxy1",
        "type": "vmess",
        "server": "example.com",
        "port": 443,
        "uuid": "uuid",
        "alterId": 0,
        "cipher": "auto",
        "tls": true
    }
]
```

#### groups

组配置的 JSON 数组：

```json
[
    {
        "name": "group1",
        "proxies": ["proxy1"]
    }
]
```

### Base64编码proxies和groups

使用 Base64 编码你的代理和组 JSON 数组：

```javascript
const proxies = JSON.stringify([/* your proxies */]);
const groups = JSON.stringify([/* your groups */]);

const base64Proxies = btoa(proxies);
const base64Groups = btoa(groups);

console.log(base64Proxies);
console.log(base64Groups);
```

## 贡献

欢迎提交问题或拉取请求以改进或修复任何问题。

## 许可证

该项目使用 MIT 许可证。
