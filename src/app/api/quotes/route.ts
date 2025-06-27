import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/data/products';

// 模拟数据库存储
let quotes: any[] = [];

// 自动报价逻辑
function calculateQuote(productId: string, quantity: number, customerType: string = 'regular') {
  const product = getProductById(productId);
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

// POST /api/quotes - 生成自动报价
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['inquiryId', 'productId', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const { inquiryId, productId, quantity, customerType = 'regular' } = body;

    // 验证数量
    if (quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: newQuote,
      message: 'Quote generated successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate quote' },
      { status: 500 }
    );
  }
}

// GET /api/quotes - 获取所有报价
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const inquiryId = searchParams.get('inquiryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredQuotes = [...quotes];

    // 按状态筛选
    if (status) {
      filteredQuotes = filteredQuotes.filter(quote => quote.status === status);
    }

    // 按询盘ID筛选
    if (inquiryId) {
      filteredQuotes = filteredQuotes.filter(quote => quote.inquiryId === inquiryId);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

    return NextResponse.json({
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

