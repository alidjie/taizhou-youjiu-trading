import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { getProductById } from "../../../data/products";
import { notFound } from "next/navigation";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <section className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm">
              <Link href="/" className="text-blue-600 hover:text-blue-800">Home</Link>
              <span className="mx-2 text-gray-500">/</span>
              <Link href="/products" className="text-blue-600 hover:text-blue-800">Products</Link>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-gray-700">{product.name}</span>
            </nav>
          </div>
        </section>

        {/* Product Detail */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Images */}
              <div>
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gray-500 text-lg">Product Image</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Thumb {i}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                    {product.category.replace("-", " ").toUpperCase()}
                  </span>
                  {product.featured && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mb-2 ml-2">
                      FEATURED
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                
                <p className="text-lg text-gray-600 mb-6">{product.description}</p>

                {product.price && (
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      ${product.price.min} - ${product.price.max}
                    </div>
                    <div className="text-gray-500">
                      Price per {product.price.unit} • {product.price.currency}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    product.inStock 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-8">
                  <Link
                    href={`/inquiry?product=${product.id}`}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block"
                  >
                    Request Quote
                  </Link>
                  <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Add to Favorites
                  </button>
                </div>

                {/* Quick Contact */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-3">Contact our sales team for personalized assistance</p>
                  <div className="space-y-2 text-sm">
                    <div>📞 +86-576-8888-8888</div>
                    <div>✉️ info@aluew.com</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Technical Specifications</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <div key={key} className={`p-4 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-200 last:border-b-0`}>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Products */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
              <div className="text-center py-12 text-gray-500">
                Related products will be displayed here based on category and tags
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


