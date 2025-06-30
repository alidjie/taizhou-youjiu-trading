# Taizhou Youjiu Trading - 外贸独立站

专业的磁性材料、磁性过滤器、漆包线和农业机械供应商网站。

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/taizhou-youjiu-trading.git
cd taizhou-youjiu-trading

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:3000
```

### 生产部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 📋 功能特性

- ✅ **企业形象展示** - 完整的公司介绍和资质展示
- ✅ **产品展示系统** - 分类产品展示和详情页面
- ✅ **客户询盘系统** - 在线询盘表单和管理
- ✅ **自动报价系统** - 智能价格计算和折扣管理
- ✅ **订单管理系统** - 完整的订单生命周期管理
- ✅ **客户管理系统** - 客户信息和沟通记录管理
- ✅ **邮件通知系统** - 多种邮件模板和自动发送
- ✅ **管理员后台** - 数据统计和业务管理面板
- ✅ **SEO优化** - 完整的搜索引擎优化
- ✅ **响应式设计** - 完美支持桌面和移动设备

## 🛠 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **部署**: Vercel
- **域名**: aluew.com

## 📁 项目结构

```
src/
├── app/                    # Next.js页面和API路由
│   ├── api/               # 后端API接口
│   │   ├── products/      # 产品管理API
│   │   ├── inquiries/     # 询盘管理API
│   │   ├── quotes/        # 报价管理API
│   │   ├── orders/        # 订单管理API
│   │   ├── customers/     # 客户管理API
│   │   └── notifications/ # 邮件通知API
│   ├── products/          # 产品展示页面
│   ├── about/             # 关于我们页面
│   ├── contact/           # 联系我们页面
│   ├── inquiry/           # 询盘表单页面
│   └── admin/             # 管理员后台
├── components/            # React组件
├── data/                  # 数据文件
├── types/                 # TypeScript类型定义
└── lib/                   # 工具函数
```

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SITE_URL=https://aluew.com
MONGODB_URI=your_mongodb_connection_string
EMAIL_SERVICE_API_KEY=your_email_service_key
```

### 数据库配置

当前项目使用内存存储作为演示。生产环境建议集成：
- MongoDB Atlas
- PostgreSQL
- Supabase

### 邮件服务配置

支持集成以下邮件服务：
- SendGrid
- Mailgun
- 阿里云邮件服务
- SMTP服务器

## 📊 API接口

### 产品管理
- `GET /api/products` - 获取产品列表
- `GET /api/products/[id]` - 获取单个产品详情

### 询盘管理
- `POST /api/inquiries` - 提交询盘
- `GET /api/inquiries` - 获取询盘列表

### 自动报价
- `POST /api/quotes` - 创建报价
- `POST /api/quotes/auto` - 自动生成报价

### 订单管理
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `PUT /api/orders/[id]` - 更新订单状态

### 客户管理
- `POST /api/customers` - 创建客户
- `GET /api/customers` - 获取客户列表

### 邮件通知
- `POST /api/notifications/email` - 发送邮件
- `POST /api/notifications/newsletter` - 发送产品更新邮件

## 🎨 自定义配置

### 公司信息更新

编辑 `src/data/company.ts`：

```typescript
export const companyInfo = {
  name: "您的公司名称",
  description: "公司描述",
  address: "公司地址",
  phone: "联系电话",
  email: "联系邮箱",
  // ...其他信息
};
```

### 产品信息更新

编辑 `src/data/products.ts`：

```typescript
export const products: Product[] = [
  {
    id: "product-001",
    name: "产品名称",
    category: "产品类别",
    price: "价格范围",
    // ...其他产品信息
  },
  // 添加更多产品
];
```

## 🚀 部署指南

### Vercel部署（推荐）

1. 将代码推送到GitHub
2. 在Vercel中导入GitHub仓库
3. 配置自定义域名
4. 设置环境变量
5. 部署完成

### 其他部署选项

- **Netlify**: 支持静态站点部署
- **AWS Amplify**: 支持全栈应用部署
- **自建服务器**: 使用Docker容器化部署

## 📈 SEO优化

- ✅ 页面元数据优化
- ✅ 自动生成网站地图
- ✅ 搜索引擎友好URL
- ✅ Open Graph支持
- ✅ Twitter卡片支持
- ✅ 结构化数据标记

## 🔒 安全建议

- 实施API速率限制
- 添加用户认证和授权
- 验证所有输入数据
- 加密敏感信息
- 定期更新依赖包

## 📞 技术支持

如需技术支持或功能扩展，请联系开发团队。

## 📄 许可证

本项目为台州优久贸易有限公司专属开发，版权所有。

---

**开发团队**: Manus AI  
**开发时间**: 2025年6月  
**技术栈**: Next.js + Tailwind CSS + Vercel

