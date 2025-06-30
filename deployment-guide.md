# 外贸独立站部署指导文档

## 项目概述

本项目是为台州优久贸易有限公司（Taizhou Youjiu Trading Co., Ltd.）开发的外贸独立站，使用 Next.js + Tailwind CSS + Vercel 架构，具备完整的企业形象展示、产品展示、客户询盘、自动报价、订单管理等功能。

### 技术栈
- **前端框架**: Next.js 14 (App Router)
- **样式框架**: Tailwind CSS
- **开发语言**: TypeScript
- **部署平台**: Vercel
- **域名**: aluew.com

## 部署步骤

### 第一步：准备GitHub仓库

1. **创建GitHub仓库**
   - 登录您的GitHub账号 (alidjie@gmail.com)
   - 创建新仓库，命名为 `taizhou-youjiu-trading`
   - 设置为公开仓库（便于Vercel部署）

2. **推送代码到GitHub**
   ```bash
   # 在项目目录下执行
   git remote add origin https://github.com/YOUR_USERNAME/taizhou-youjiu-trading.git
   git branch -M main
   git push -u origin main
   ```

### 第二步：Vercel部署

1. **连接GitHub到Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击 "New Project"
   - 选择 `taizhou-youjiu-trading` 仓库

2. **配置部署设置**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
   - Install Command: `npm install`

3. **环境变量配置**（可选）
   ```
   NEXT_PUBLIC_SITE_URL=https://aluew.com
   MONGODB_URI=your_mongodb_connection_string
   EMAIL_SERVICE_API_KEY=your_email_service_key
   ```

4. **自定义域名配置**
   - 在Vercel项目设置中添加域名 `aluew.com`
   - 在域名DNS设置中添加CNAME记录指向Vercel

### 第三步：域名DNS配置

在您的域名管理面板中添加以下DNS记录：

```
类型: CNAME
名称: @
值: cname.vercel-dns.com

类型: CNAME  
名称: www
值: cname.vercel-dns.com
```

### 第四步：SSL证书

Vercel会自动为您的域名配置SSL证书，通常在域名配置后几分钟内生效。

## 功能特性

### 已实现功能

1. **企业形象展示**
   - 公司介绍页面
   - 企业资质展示
   - 联系信息展示

2. **产品展示系统**
   - 产品分类展示
   - 产品详情页面
   - 产品搜索功能

3. **客户询盘系统**
   - 在线询盘表单
   - 自动邮件确认
   - 询盘管理后台

4. **自动报价系统**
   - 基于产品和数量的智能报价
   - 客户类型折扣
   - 报价有效期管理

5. **订单管理系统**
   - 订单创建和跟踪
   - 订单状态更新
   - 客户订单历史

6. **客户管理系统**
   - 客户信息管理
   - 客户分类和标签
   - 客户沟通记录

7. **邮件通知系统**
   - 询盘确认邮件
   - 报价邮件
   - 订单确认邮件
   - 发货通知邮件
   - 产品更新邮件

8. **管理员后台**
   - 数据统计面板
   - 询盘和订单管理
   - 客户管理
   - 快速操作功能

### SEO优化

- 完整的页面元数据
- 自动生成的网站地图
- 搜索引擎友好的URL结构
- Open Graph和Twitter卡片支持
- 结构化数据标记

## 后续维护

### 内容更新

1. **产品信息更新**
   - 编辑 `src/data/products.ts` 文件
   - 添加产品图片到 `public/images/products/` 目录
   - 重新部署网站

2. **公司信息更新**
   - 编辑 `src/data/company.ts` 文件
   - 更新联系信息和公司描述

### 功能扩展

1. **数据库集成**
   - 当前使用内存存储，建议集成MongoDB或PostgreSQL
   - 更新API路由以连接真实数据库

2. **邮件服务集成**
   - 集成SendGrid、Mailgun或阿里云邮件服务
   - 配置SMTP设置

3. **支付系统集成**
   - 集成PayPal、Stripe或支付宝
   - 添加在线支付功能

### 性能监控

1. **Vercel Analytics**
   - 在Vercel控制台启用Analytics
   - 监控网站访问量和性能

2. **Google Analytics**
   - 添加Google Analytics跟踪代码
   - 监控用户行为和转化率

## 安全建议

1. **API安全**
   - 添加API速率限制
   - 实施用户认证和授权
   - 验证所有输入数据

2. **数据保护**
   - 加密敏感数据
   - 定期备份数据库
   - 实施GDPR合规措施

## 技术支持

如需技术支持或功能扩展，请联系开发团队。项目代码已完全开源，您可以根据业务需求进行自定义开发。

## 项目文件结构

```
taizhou-youjiu-trading/
├── src/
│   ├── app/                 # Next.js App Router页面
│   │   ├── api/            # API路由
│   │   ├── products/       # 产品页面
│   │   ├── about/          # 关于我们页面
│   │   ├── contact/        # 联系我们页面
│   │   ├── inquiry/        # 询盘页面
│   │   └── admin/          # 管理员后台
│   ├── components/         # React组件
│   ├── data/              # 数据文件
│   ├── types/             # TypeScript类型定义
│   └── lib/               # 工具函数
├── public/                # 静态资源
├── test-report.md         # 测试报告
└── deployment-guide.md    # 部署指导文档
```

## 联系信息

- **项目开发**: Manus AI
- **技术栈**: Next.js + Tailwind CSS + Vercel
- **部署时间**: 2025年6月
- **维护建议**: 定期更新依赖包，监控网站性能

