module.exports = {

"[project]/.next-internal/server/app/api/customers/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/src/app/api/customers/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>GET),
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
// 模拟数据库存储
let customers = [];
async function POST(request) {
    try {
        const body = await request.json();
        // 验证必需字段
        const requiredFields = [
            'name',
            'email',
            'country'
        ];
        for (const field of requiredFields){
            if (!body[field]) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: false,
                    error: `Missing required field: ${field}`
                }, {
                    status: 400
                });
            }
        }
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Invalid email format'
            }, {
                status: 400
            });
        }
        // 检查邮箱是否已存在
        const existingCustomer = customers.find((c)=>c.email === body.email);
        if (existingCustomer) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Customer with this email already exists'
            }, {
                status: 409
            });
        }
        // 创建新客户
        const newCustomer = {
            id: `customer-${Date.now()}`,
            name: body.name,
            email: body.email,
            phone: body.phone || null,
            company: body.company || null,
            country: body.country,
            subscribed: body.subscribed || false,
            registeredAt: new Date(),
            lastOrderDate: null,
            totalOrders: 0,
            totalSpent: 0,
            customerType: 'regular',
            notes: body.notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // 保存到模拟数据库
        customers.push(newCustomer);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: newCustomer,
            message: 'Customer created successfully'
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to create customer'
        }, {
            status: 500
        });
    }
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const country = searchParams.get('country');
        const customerType = searchParams.get('customerType');
        const subscribed = searchParams.get('subscribed');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        let filteredCustomers = [
            ...customers
        ];
        // 按国家筛选
        if (country) {
            filteredCustomers = filteredCustomers.filter((customer)=>customer.country === country);
        }
        // 按客户类型筛选
        if (customerType) {
            filteredCustomers = filteredCustomers.filter((customer)=>customer.customerType === customerType);
        }
        // 按订阅状态筛选
        if (subscribed !== null) {
            const isSubscribed = subscribed === 'true';
            filteredCustomers = filteredCustomers.filter((customer)=>customer.subscribed === isSubscribed);
        }
        // 搜索功能
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredCustomers = filteredCustomers.filter((customer)=>customer.name.toLowerCase().includes(searchTerm) || customer.email.toLowerCase().includes(searchTerm) || customer.company && customer.company.toLowerCase().includes(searchTerm));
        }
        // 按注册日期排序（最新的在前）
        filteredCustomers.sort((a, b)=>new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: paginatedCustomers,
            pagination: {
                page,
                limit,
                total: filteredCustomers.length,
                totalPages: Math.ceil(filteredCustomers.length / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch customers'
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__d1d61999._.js.map