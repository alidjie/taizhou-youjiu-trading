import { NextRequest, NextResponse } from 'next/server';
import { sampleProducts } from '@/data/products';

// GET /api/products - 获取所有产品或按类别筛选
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    let products = [...sampleProducts];

    // 按类别筛选
    if (category) {
      products = products.filter(product => product.category === category);
    }

    // 筛选特色产品
    if (featured === 'true') {
      products = products.filter(product => product.featured);
    }

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.shortDescription.toLowerCase().includes(searchTerm)
      );
    }

    return NextResponse.json({
      success: true,
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - 添加新产品（管理员功能）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['name', 'category', 'description', 'shortDescription'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
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
    return NextResponse.json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

