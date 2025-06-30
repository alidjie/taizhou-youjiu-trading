import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { sampleProducts, getProductsByCategory } from "../../data/products";
import { productCategories } from "../../data/company";

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Page Header */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive range of high-quality industrial products for your business needs
              </p>
            </div>
          </div>
        </section>

        {/* Product Categories */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {productCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`#${category.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{category.name.charAt(0)}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Products by Category */}
            {productCategories.map((category) => {
              const categoryProducts = getProductsByCategory(category.id as any);
              return (
                <div key={category.id} id={category.id} className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">{category.name}</h2>
                    <span className="text-gray-500">{categoryProducts.length} products</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group">
                        <div className="h-48 bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                          <span className="text-gray-500">Product Image</span>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">{product.shortDescription}</p>
                          
                          {/* Key Specifications */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Specifications:</h4>
                            <div className="space-y-1">
                              {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="text-sm text-gray-600">
                                  <span className="font-medium">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          </div>

                          {product.price && (
                            <div className="mb-4">
                              <span className="text-lg font-semibold text-blue-600">
                                ${product.price.min} - ${product.price.max}
                              </span>
                              <span className="text-gray-500 text-sm ml-1">/ {product.price.unit}</span>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Link
                              href={`/products/detail/${product.id}`}
                              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </Link>
                            <Link
                              href={`/inquiry?product=${product.id}`}
                              className="flex-1 border border-blue-600 text-blue-600 px-4 py-2 rounded text-center hover:bg-blue-50 transition-colors"
                            >
                              Inquire
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


