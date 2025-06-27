module.exports = {

"[project]/.next-internal/server/app/api/quotes/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

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
"[project]/src/data/products.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getFeaturedProducts": (()=>getFeaturedProducts),
    "getProductById": (()=>getProductById),
    "getProductsByCategory": (()=>getProductsByCategory),
    "sampleProducts": (()=>sampleProducts)
});
const sampleProducts = [
    // 磁性材料
    {
        id: 'mag-001',
        name: 'Neodymium Permanent Magnet',
        category: 'magnetic-materials',
        description: 'High-performance neodymium permanent magnets with excellent magnetic properties. Suitable for motors, generators, and various industrial applications.',
        shortDescription: 'High-performance neodymium permanent magnets',
        images: [
            '/images/products/neodymium-magnet.jpg'
        ],
        specifications: {
            'Material': 'NdFeB',
            'Grade': 'N35-N52',
            'Shape': 'Block, Disc, Ring, Arc',
            'Coating': 'Ni-Cu-Ni, Zn, Epoxy',
            'Working Temperature': '80°C-200°C',
            'Magnetic Field': '12000-15000 Gauss'
        },
        price: {
            min: 0.5,
            max: 50,
            currency: 'USD',
            unit: 'piece'
        },
        inStock: true,
        featured: true
    },
    {
        id: 'mag-002',
        name: 'Ferrite Permanent Magnet',
        category: 'magnetic-materials',
        description: 'Cost-effective ferrite permanent magnets with good corrosion resistance and stable performance.',
        shortDescription: 'Cost-effective ferrite permanent magnets',
        images: [
            '/images/products/ferrite-magnet.jpg'
        ],
        specifications: {
            'Material': 'Ferrite',
            'Grade': 'Y30, Y35, Y40',
            'Shape': 'Block, Ring, Arc, Custom',
            'Working Temperature': '-40°C to +250°C',
            'Magnetic Field': '3800-4200 Gauss'
        },
        price: {
            min: 0.1,
            max: 10,
            currency: 'USD',
            unit: 'piece'
        },
        inStock: true,
        featured: false
    },
    // 磁性过滤器
    {
        id: 'filter-001',
        name: 'Magnetic Separator Bar',
        category: 'magnetic-filters',
        description: 'High-intensity magnetic separator bars for removing ferrous contaminants from dry materials.',
        shortDescription: 'High-intensity magnetic separator bars',
        images: [
            '/images/products/magnetic-separator-bar.jpg'
        ],
        specifications: {
            'Magnetic Strength': '12000 Gauss',
            'Diameter': '25mm, 32mm, 50mm',
            'Length': '100mm-3000mm',
            'Material': 'Stainless Steel 316L',
            'Working Temperature': 'Up to 80°C'
        },
        price: {
            min: 20,
            max: 200,
            currency: 'USD',
            unit: 'piece'
        },
        inStock: true,
        featured: true
    },
    // 漆包线
    {
        id: 'wire-001',
        name: 'Enameled Copper Wire',
        category: 'enameled-wire',
        description: 'High-quality enameled copper wire for transformers, motors, and electrical equipment.',
        shortDescription: 'High-quality enameled copper wire',
        images: [
            '/images/products/enameled-copper-wire.jpg'
        ],
        specifications: {
            'Conductor': 'Copper',
            'Insulation': 'Polyurethane, Polyester',
            'Diameter': '0.1mm-5.0mm',
            'Temperature Class': '130°C, 155°C, 180°C',
            'Standard': 'IEC 60317, NEMA MW1000'
        },
        price: {
            min: 8,
            max: 15,
            currency: 'USD',
            unit: 'kg'
        },
        inStock: true,
        featured: true
    },
    // 农用机械
    {
        id: 'agri-001',
        name: 'Rotary Tiller',
        category: 'agricultural-machinery',
        description: 'Heavy-duty rotary tiller for soil preparation and cultivation. Suitable for tractors 25-60HP.',
        shortDescription: 'Heavy-duty rotary tiller for soil preparation',
        images: [
            '/images/products/rotary-tiller.jpg'
        ],
        specifications: {
            'Working Width': '1.2m, 1.5m, 1.8m, 2.0m',
            'Tractor Power': '25-60HP',
            'Tilling Depth': '15-20cm',
            'Blades': 'Heat-treated steel',
            'Weight': '280-450kg'
        },
        price: {
            min: 800,
            max: 1500,
            currency: 'USD',
            unit: 'unit'
        },
        inStock: true,
        featured: true
    },
    {
        id: 'agri-002',
        name: 'Disc Harrow',
        category: 'agricultural-machinery',
        description: 'Professional disc harrow for breaking up soil and incorporating crop residues.',
        shortDescription: 'Professional disc harrow for soil breaking',
        images: [
            '/images/products/disc-harrow.jpg'
        ],
        specifications: {
            'Working Width': '1.5m, 2.0m, 2.5m',
            'Disc Diameter': '510mm, 560mm, 610mm',
            'Disc Thickness': '5mm, 6mm',
            'Tractor Power': '40-80HP',
            'Weight': '450-750kg'
        },
        price: {
            min: 1200,
            max: 2500,
            currency: 'USD',
            unit: 'unit'
        },
        inStock: true,
        featured: false
    },
    {
        id: 'agri-003',
        name: 'Seed Drill',
        category: 'agricultural-machinery',
        description: 'Precision seed drill for accurate seed placement and optimal crop establishment.',
        shortDescription: 'Precision seed drill for accurate planting',
        images: [
            '/images/products/seed-drill.jpg'
        ],
        specifications: {
            'Working Width': '2.0m, 2.5m, 3.0m',
            'Row Spacing': '125mm, 150mm, 175mm',
            'Seed Box Capacity': '200L, 300L, 400L',
            'Tractor Power': '35-70HP',
            'Planting Depth': '10-80mm'
        },
        price: {
            min: 2000,
            max: 4000,
            currency: 'USD',
            unit: 'unit'
        },
        inStock: true,
        featured: true
    }
];
const getProductsByCategory = (category)=>{
    return sampleProducts.filter((product)=>product.category === category);
};
const getFeaturedProducts = ()=>{
    return sampleProducts.filter((product)=>product.featured);
};
const getProductById = (id)=>{
    return sampleProducts.find((product)=>product.id === id);
};
}}),
"[project]/src/app/api/quotes/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>GET),
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/products.ts [app-route] (ecmascript)");
;
;
// 模拟数据库存储
let quotes = [];
// 自动报价逻辑
function calculateQuote(productId, quantity, customerType = 'regular') {
    const product = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProductById"])(productId);
    if (!product || !product.price) {
        throw new Error('Product not found or no price available');
    }
    let basePrice = product.price.min;
    // 根据数量计算折扣
    let quantityDiscount = 0;
    if (quantity >= 1000) {
        quantityDiscount = 0.15; // 15% 折扣
    } else if (quantity >= 500) {
        quantityDiscount = 0.10; // 10% 折扣
    } else if (quantity >= 100) {
        quantityDiscount = 0.05; // 5% 折扣
    }
    // 根据客户类型调整价格
    let customerDiscount = 0;
    if (customerType === 'vip') {
        customerDiscount = 0.10; // VIP客户额外10%折扣
    } else if (customerType === 'wholesale') {
        customerDiscount = 0.08; // 批发客户额外8%折扣
    }
    // 计算最终单价
    const totalDiscount = quantityDiscount + customerDiscount;
    const unitPrice = basePrice * (1 - totalDiscount);
    const totalPrice = unitPrice * quantity;
    // 报价有效期（30天）
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    return {
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        quantityDiscount: Math.round(quantityDiscount * 100),
        customerDiscount: Math.round(customerDiscount * 100),
        totalDiscount: Math.round(totalDiscount * 100),
        validUntil,
        currency: product.price.currency,
        terms: 'FOB Shanghai, Payment: 30% T/T in advance, 70% before shipment'
    };
}
async function POST(request) {
    try {
        const body = await request.json();
        // 验证必需字段
        const requiredFields = [
            'inquiryId',
            'productId',
            'quantity'
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
        const { inquiryId, productId, quantity, customerType = 'regular' } = body;
        // 验证数量
        if (quantity <= 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Quantity must be greater than 0'
            }, {
                status: 400
            });
        }
        // 计算报价
        const quoteCalculation = calculateQuote(productId, quantity, customerType);
        // 创建报价记录
        const newQuote = {
            id: `quote-${Date.now()}`,
            inquiryId,
            productId,
            quantity,
            ...quoteCalculation,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // 保存到模拟数据库
        quotes.push(newQuote);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: newQuote,
            message: 'Quote generated successfully'
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error generating quote:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate quote'
        }, {
            status: 500
        });
    }
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const inquiryId = searchParams.get('inquiryId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        let filteredQuotes = [
            ...quotes
        ];
        // 按状态筛选
        if (status) {
            filteredQuotes = filteredQuotes.filter((quote)=>quote.status === status);
        }
        // 按询盘ID筛选
        if (inquiryId) {
            filteredQuotes = filteredQuotes.filter((quote)=>quote.inquiryId === inquiryId);
        }
        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: paginatedQuotes,
            pagination: {
                page,
                limit,
                total: filteredQuotes.length,
                totalPages: Math.ceil(filteredQuotes.length / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch quotes'
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__16c837af._.js.map