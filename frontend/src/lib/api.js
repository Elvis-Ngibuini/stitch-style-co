const API_BASE_URL = 'http://localhost:4000/api';

export const fetchProducts = async (page = 1, category, maxPrice) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (category) params.append('category', category);
  if (maxPrice) params.append('maxPrice', maxPrice.toString());

  const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};
