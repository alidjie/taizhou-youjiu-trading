module.exports = {

"[project]/.next-internal/server/app/api/products/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

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
"[project]/src/app/api/products/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
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
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');
        const search = searchParams.get('search');
        let products = [
            ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sampleProducts"]
        ];
        // 按类别筛选
        if (category) {
            products = products.filter((product)=>product.category === category);
        }
        // 筛选特色产品
        if (featured === 'true') {
            products = products.filter((product)=>product.featured);
        }
        // 搜索功能
        if (search) {
            const searchTerm = search.toLowerCase();
            products = products.filter((product)=>product.name.toLowerCase().includes(searchTerm) || product.description.toLowerCase().includes(searchTerm) || product.shortDescription.toLowerCase().includes(searchTerm));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: products,
            total: products.length
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch products'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        // 验证必需字段
        const requiredFields = [
            'name',
            'category',
            'description',
            'shortDescription'
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
        // 生成新产品ID
        const newProduct = {
            id: `product-${Date.now()}`,
            name: body.name,
            category: body.category,
            description: body.description,
            shortDescription: body.shortDescription,
            images: body.images || [],
            specifications: body.specifications || {},
            price: body.price || null,
            inStock: body.inStock !== undefined ? body.inStock : true,
            featured: body.featured !== undefined ? body.featured : false
        };
        // 在实际应用中，这里应该保存到数据库
        // 现在只是返回新产品信息
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: newProduct,
            message: 'Product created successfully'
        }, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to create product'
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__f94e296b._.js.map