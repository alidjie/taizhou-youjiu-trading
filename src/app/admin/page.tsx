
interface DashboardStats {
  totalInquiries: number;
  totalQuotes: number;
  totalOrders: number;
  totalCustomers: number;
  recentInquiries: Inquiry[];
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInquiries: 0,
    totalQuotes: 0,
    totalOrders: 0,
    totalCustomers: 0,
    recentInquiries: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 获取统计数据
      const [inquiriesRes, quotesRes, ordersRes, customersRes] = await Promise.all([
        fetch("/api/inquiries"),
        fetch("/api/quotes"),
        fetch("/api/orders"),
        fetch("/api/customers")
      ]);

      const [inquiries, quotes, orders, customers] = await Promise.all([
        inquiriesRes.json(),
        quotesRes.json(),
        ordersRes.json(),
        customersRes.json()
      ]);

      setStats({
        totalInquiries: inquiries.data?.length || 0,
        totalQuotes: quotes.data?.length || 0,
        totalOrders: orders.data?.length || 0,
        totalCustomers: customers.data?.length || 0,
        recentInquiries: inquiries.data?.slice(0, 5) || [],
        recentOrders: orders.data?.slice(0, 5) || []
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAutoQuote = async (
    inquiryId: string,
    productId: string,
    quantity: number,
    customerEmail: string
  ) => {
    try {
      const response = await fetch("/api/quotes/auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inquiryId,
          productId,
          quantity,
          customerEmail
        })
      });

      if (response.ok) {
        alert("Auto quote generated and sent successfully!");
        fetchDashboardData(); // 刷新数据
      } else {
        alert("Failed to generate auto quote");
      }
    } catch (error) {
      console.error("Error generating auto quote:", error);
      alert("Error generating auto quote");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        {/* Page Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your business operations</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📧</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Quotes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📦</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Inquiries */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Inquiries</h2>
              </div>
              <div className="p-6">
                {stats.recentInquiries.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{inquiry.customerName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            inquiry.status === "new" ? "bg-blue-100 text-blue-800" :
                            inquiry.status === "replied" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {inquiry.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{inquiry.email}</p>
                        <p className="text-sm text-gray-700 mb-3">{inquiry.message}</p>
                        {inquiry.productId && (
                          <button
                            onClick={() => generateAutoQuote(inquiry.id, inquiry.productId, inquiry.quantity || 1, inquiry.email)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Generate Auto Quote
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent inquiries</p>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <div className="p-6">
                {stats.recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{order.customerName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                            order.status === "shipped" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Order ID: {order.id}</p>
                        <p className="text-sm font-semibold text-gray-900">Total: ${order.totalAmount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent orders</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Send Newsletter
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Export Customer Data
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Generate Reports
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


