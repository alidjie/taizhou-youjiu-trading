import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { companyInfo } from "@/data/company";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About {companyInfo.shortName}</h1>
              <p className="text-xl max-w-3xl mx-auto">
                {companyInfo.description}
              </p>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Founded in {companyInfo.established}, {companyInfo.name} has grown from a small trading company 
                    to a leading supplier of industrial products in China. With over a decade of experience, 
                    we&apos;ve been committed to providing innovative solutions and superior products to clients worldwide.
                  </p>
                  <p>
                    Our commitment to quality, innovation, and customer satisfaction has made us a trusted 
                    partner for businesses across {companyInfo.markets.join(", ")}. We specialize in 
                    magnetic materials, magnetic filters, enameled wire, and agricultural machinery.
                  </p>
                  <p>
                    Today, we serve hundreds of customers globally, providing them with high-quality products 
                    and exceptional service. Our team of {companyInfo.employees} dedicated professionals 
                    works tirelessly to meet and exceed customer expectations.
                  </p>
                </div>
              </div>
              <div className="bg-gray-200 aspect-video rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-lg">Company Image</span>
              </div>
            </div>
          </div>
        </section>

        {/* Company Stats */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Achievements</h2>
              <p className="text-lg text-gray-600">Numbers that speak for our success</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">15+</div>
                <div className="text-gray-600">Years of Experience</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Global Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                <div className="text-gray-600">Countries Served</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
                <div className="text-gray-600">Products Delivered</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To provide high-quality industrial products and exceptional service to our global customers, 
                  helping them achieve their business goals through reliable partnerships and innovative solutions.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">👁️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To become the leading global supplier of magnetic materials, filters, enameled wire, and 
                  agricultural machinery, recognized for our quality, innovation, and customer-centric approach.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-lg text-gray-600">The principles that guide everything we do</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Excellence</h3>
                <p className="text-gray-600">
                  We maintain the highest standards in all our products and services, 
                  ensuring customer satisfaction and long-term partnerships.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Customer Focus</h3>
                <p className="text-gray-600">
                  Our customers are at the heart of everything we do. We listen, understand, 
                  and deliver solutions that exceed expectations.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We continuously seek new ways to improve our products and services, 
                  staying ahead of industry trends and customer needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quality Certifications</h2>
              <p className="text-lg text-gray-600">Recognized standards that ensure our quality commitment</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {companyInfo.certifications.map((cert) => (
                <div key={cert} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="bg-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-500 text-sm">Cert Logo</span>
                  </div>
                  <h3 className="text-lg font-semibold">{cert}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
            <p className="text-xl mb-8">
              Let&apos;s discuss how we can help your business grow with our quality products and services.
            </p>
            <div className="space-x-4">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Contact Us
              </a>
              <a
                href="/inquiry"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
              >
                Request Quote
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


