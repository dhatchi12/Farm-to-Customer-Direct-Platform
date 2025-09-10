'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Leaf, ShoppingCart, User, LogOut, Plus, Search, Sprout, Check } from 'lucide-react';
import { NegotiationDialog } from '@/components/NegotiationDialog';
import { NegotiationsList } from '@/components/NegotiationsList';
import { OrdersList } from '@/components/OrdersList';
import { OrderDialog } from '@/components/OrderDialog';

export default function Home() {
  const { user, login, register, logout, isLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    role: 'CUSTOMER', 
    phone: '', 
    address: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(loginForm.email, loginForm.password);
    setIsSubmitting(false);
    if (!success) {
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await register(registerForm);
    setIsSubmitting(false);
    if (!success) {
      alert('Registration failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="h-12 w-12 text-green-600 mr-3" />
              <h1 className="text-4xl font-bold text-green-800">FarmDirect</h1>
            </div>
            <p className="text-lg text-green-700 mb-8">Direct connection between farmers and customers</p>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              {/* Customer Portal Card */}
              <Card className="w-full max-w-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/customer-login'}>
                <CardHeader className="text-center">
                  <ShoppingCart className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-blue-800">Customer Portal</CardTitle>
                  <CardDescription>Browse fresh products from local farmers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Enter as Customer
                  </Button>
                </CardContent>
              </Card>

              {/* Farmer Portal Card */}
              <Card className="w-full max-w-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/farmer-login'}>
                <CardHeader className="text-center">
                  <Leaf className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-green-800">Farmer Portal</CardTitle>
                  <CardDescription>Sell your fresh produce directly to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Leaf className="h-4 w-4 mr-2" />
                    Enter as Farmer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in - show role-based interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-green-800">FarmDirect</h1>
              <Badge variant={user.role === 'FARMER' ? 'default' : 'secondary'}>
                {user.role === 'FARMER' ? 'Farmer' : 'Customer'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {user.role === 'FARMER' ? <FarmerDashboard /> : <CustomerDashboard />}
      </main>
    </div>
  );
}

// Farmer Dashboard Component
function FarmerDashboard() {
  const { apiCall } = useAuth();
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    category: '',
    image: ''
  });

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNewProduct({ ...newProduct, image: data.imageUrl });
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiCall('/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct)
      });
      
      if (response.ok) {
        setShowAddForm(false);
        setNewProduct({ name: '', description: '', price: '', quantity: '', unit: 'kg', category: '', image: '' });
        fetchProducts();
      } else {
        alert('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiCall('/api/products/my');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="e.g., Vegetables, Fruits"
                />
              </div>
              <div>
                <Label htmlFor="price">Price per unit</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Available Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="bunch">Bunch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Describe your product..."
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle file upload
                      handleImageUpload(file);
                    }
                  }}
                />
                {newProduct.image && (
                  <div className="mt-2">
                    <img 
                      src={newProduct.image} 
                      alt="Product preview" 
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex space-x-2">
                <Button type="submit">Add Product</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {product.name}
                <Badge variant="outline">{product.category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.image && (
                <div className="mb-4">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}
              <p className="text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">${product.price}/{product.unit}</span>
                <span className="text-sm text-gray-500">{product.quantity} {product.unit} available</span>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="destructive">Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Negotiations Section */}
      <NegotiationsList userType="FARMER" />

      {/* Orders Section */}
      <OrdersList userType="FARMER" />
    </div>
  );
}

// Customer Dashboard Component
function CustomerDashboard() {
  const { apiCall } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await apiCall('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.quantity) }
            : item
        );
      } else {
        return [...prevCart, {
          productId: product.id,
          farmerId: product.farmer.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          quantity: 1,
          maxQuantity: product.quantity
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Browse Products</h2>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {product.name}
                <Badge variant="secondary">{product.category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.image && (
                <div className="mb-4">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-green-600">${product.price}<span className="text-sm font-normal text-gray-500">/{product.unit}</span></span>
                <span className="text-sm text-gray-500">{product.quantity} {product.unit} available</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={() => addToCart(product)}
                  disabled={product.quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <NegotiationDialog product={product} />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Sold by: {product.farmer?.name || 'Local Farmer'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or check back later for new products.</p>
        </div>
      )}

      {/* Negotiations Section */}
      <NegotiationsList userType="CUSTOMER" />

      {/* Orders Section */}
      <OrdersList userType="CUSTOMER" />

      {/* Order Dialog */}
      <OrderDialog 
        items={cart} 
        onOrderComplete={() => setCart([])} 
      />
    </div>
  );
}