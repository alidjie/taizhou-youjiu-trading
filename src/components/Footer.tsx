import { companyInfo } from "../data/company";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">{companyInfo.name}</h3>
            <p className="text-gray-300 mb-4">{companyInfo.description}</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p>📍 {companyInfo.address}</p>
              <p>📞 {companyInfo.phone}</p>
              <p>✉️ {companyInfo.email}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/products" className="hover:text-white transition-colors">Products</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/inquiry" className="hover:text-white transition-colors">Inquiry</a></li>
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/products/magnetic-materials" className="hover:text-white transition-colors">Magnetic Materials</a></li>
              <li><a href="/products/magnetic-filters" className="hover:text-white transition-colors">Magnetic Filters</a></li>
              <li><a href="/products/enameled-wire" className="hover:text-white transition-colors">Enameled Wire</a></li>
              <li><a href="/products/agricultural-machinery" className="hover:text-white transition-colors">Agricultural Machinery</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


