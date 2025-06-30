import { Product } from '@/types';

// 示例产品数据
export const sampleProducts: Product[] = [
  // 磁性材料
  {
    id: 'mag-001',
    name: 'Neodymium Permanent Magnet',
    category: 'magnetic-materials',
    description: 'High-performance neodymium permanent magnets with excellent magnetic properties. Suitable for motors, generators, and various industrial applications.',
    shortDescription: 'High-performance neodymium permanent magnets',
    images: ['/images/products/neodymium-magnet.jpg'],
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
    images: ['/images/products/ferrite-magnet.jpg'],
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
    images: ['/images/products/magnetic-separator-bar.jpg'],
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
    images: ['/images/products/enameled-copper-wire.jpg'],
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
    images: ['/images/products/rotary-tiller.jpg'],
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
    images: ['/images/products/disc-harrow.jpg'],
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
    images: ['/images/products/seed-drill.jpg'],
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

// 按类别获取产品
export const getProductsByCategory = (category: Product['category']) => {
  return sampleProducts.filter(product => product.category === category);
};

// 获取特色产品
export const getFeaturedProducts = () => {
  return sampleProducts.filter(product => product.featured);
};

// 根据ID获取产品
export const getProductById = (id: string) => {
  return sampleProducts.find(product => product.id === id);
};

