import { useState, useEffect } from 'react'
import { fetchProducts } from './lib/api'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts(1)
        setProducts(data.products)
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Stitch & Style Co</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {product.images[0] && (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              <p className="text-gray-600 mb-2">${product.basePrice}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
