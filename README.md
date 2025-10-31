# 新闻总结网站 📰

一个简洁优雅的新闻搜索和总结工具，帮助您快速获取最新资讯并智能总结。

## ✨ 功能特性

- 🔍 **智能搜索**: 输入关键词，获取24小时内的最新相关资讯
- 📊 **智能总结**: 自动提取关键信息，生成综合总结报告
- 🔐 **隐私保护**: API Key仅存储在本地浏览器，绝不上传服务器
- 📱 **响应式设计**: 完美适配手机、平板和桌面设备
- ⚡ **快速流畅**: 纯前端实现，无需后端服务器

## 🚀 快速开始

### 1. 获取 News API Key

1. 访问 [News API](https://newsapi.org/) 官网
2. 点击 "Get API Key" 注册免费账号
3. 复制您的API Key（32位字符串）

### 2. 使用网站

1. 打开网站
2. 首次使用会提示设置API Key
3. 输入您的API Key并保存
4. 在搜索框输入感兴趣的话题（如"人工智能"）
5. 点击"获取"按钮
6. 等待几秒，查看总结结果

## 📖 使用说明

### API Key 设置
- 点击页面右上角的设置图标⚙️
- 输入您的 News API Key
- 点击保存
- API Key 会安全地保存在您的浏览器本地存储中

### 搜索技巧
- 使用具体的关键词（如"特斯拉"、"ChatGPT"）
- 支持中英文关键词
- 可以使用多个关键词（空格分隔）

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **API**: News API
- **部署**: GitHub Pages
- **特性**: 
  - 模块化设计
  - 原生 JavaScript（无框架依赖）
  - LocalStorage 数据持久化
  - Fetch API 异步请求

## 📁 项目结构

```
10.31/
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── storage.js         # API Key存储管理
│   ├── api.js             # News API客户端
│   ├── summarizer.js      # 总结引擎
│   └── app.js             # 主应用控制器
├── docs/                  # 项目文档
├── .gitignore            # Git忽略文件
└── README.md             # 项目说明
```

## 🔒 隐私政策

- ✅ 您的 API Key 仅存储在浏览器的 localStorage 中
- ✅ 不会上传到任何服务器
- ✅ 不会被其他网站访问
- ✅ 您可以随时清除或修改 API Key
- ✅ 本项目代码开源，可审查安全性

## 🌐 部署

本项目已部署到 GitHub Pages，可直接访问使用。

### 本地运行
1. 克隆仓库
   ```bash
   git clone <repository-url>
   ```
2. 使用本地服务器打开（推荐使用 Live Server）
   ```bash
   # 使用 Python
   python -m http.server 8000
   
   # 或使用 Node.js
   npx serve
   ```
3. 在浏览器访问 `http://localhost:8000`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

## 📧 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

**注意**: News API 免费版每天有100次请求限制，请合理使用。
