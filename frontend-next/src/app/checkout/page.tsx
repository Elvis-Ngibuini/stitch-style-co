'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { orderApi } from '@/lib/api-endpoints';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { formatPrice } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_fake');

const shippingOptions = [
  { id: 'standard', name: 'Standard Shipping', price: 15, days: '5-7 business days' },
  { id: 'express', name: 'Express Shipping', price: 25, days: '2-3 business days' },
  { id: 'overnight', name: 'Overnight Shipping', price: 45, days: '1 business day' },
];

const initialFormData = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  phone: '',
  shippingOption: 'standard',
  saveInfo: false,
};

function CheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { cart, subtotal, itemCount, clearCart } = useCart();
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [step, setStep] = useState(1);

  const shippingCost = shippingOptions.find(s => s.id === selectedShipping)?.price || 0;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
      }));
    }
  }, [user]);

  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum <= 1) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
    }
    
    if (stepNum <= 2) {
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    if (!stripe || !elements) {
      setPaymentError('Stripe not loaded');
      return;
    }

    setProcessing(true);
    setPaymentError('');

    try {
      const shippingAddress = {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };

      const { clientSecret, orderId } = await orderApi.createPaymentIntent({
        shippingAddress,
        sessionId: null,
      });

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
              country: formData.country,
            },
          },
        },
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}`);
      }
    } catch (error) {
      setPaymentError(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const shippingOption = shippingOptions.find(s => s.id === selectedShipping);

  if (itemCount === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <Link href="/cart" className="mt-4 inline-block">
          <Button>Go to Cart</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Contact', description: 'Email & phone' },
    { number: 2, title: 'Shipping', description: 'Delivery address' },
    { number: 3, title: 'Payment', description: 'Secure checkout' },
  ];

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <React.Fragment key={s.number}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step > s.number ? 'bg-gray-900 text-white' : step === s.number ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s.number}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <p className={`text-sm font-medium ${step >= s.number ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</p>
                    <p className={`text-xs ${step >= s.number ? 'text-gray-500' : 'text-gray-400'}`}>{s.description}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${step > s.number ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  )}
                </div>
              )}
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                    />
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={errors.firstName}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={errors.lastName}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                  />
                  <Input
                    label="Apartment, suite, etc. (optional)"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleChange}
                  />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      required
                    />
                    <Input
                      label="ZIP Code"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      error={errors.zipCode}
                      required
                    />
                  </div>
                  <Input
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedShipping === option.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingOption"
                          value={option.id}
                          checked={selectedShipping === option.id}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="h-4 w-4 text-gray-900 focus:ring-gray-500"
                        />
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-gray-900">{option.name}</p>
                          <p className="text-sm text-gray-500">{option.days}</p>
                        </div>
                        <span className="font-medium text-gray-900">
                          {option.price === 0 ? 'Free' : formatPrice(option.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Information
                      </label>
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#1a1a1a',
                              '::placeholder': { color: '#9ca3af' },
                            },
                            invalid: { color: '#ef4444' },
                          },
                        }}
                      />
                    </div>
                    {paymentError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {paymentError}
                      </div>
                    )}
                    <Button
                      size="xl"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={processing}
                      loading={processing}
                    >
                      Pay {formatPrice(total)}
                    </Button>
                    <p className="text-center text-xs text-gray-500">
                      Secured by Stripe. Your payment information is encrypted.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                {step > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button onClick={handleNext}>Continue</Button>
                ) : (
                  <Button onClick={handleSubmit} loading={processing}>
                    Pay {formatPrice(total)}
                  </Button>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="border-b">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cart?.items.map((item) => (
                      <div key={item._id} className="flex gap-3">
                        <div className="relative h-16 w-12 flex-shrink-0 rounded bg-gray-100 overflow-hidden">
                          {item.product.images[0] && (
                            <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.title}</p>
                          <p className="text-xs text-gray-500">{item.variant.color} / {item.variant.size}</p>
                          <p className="text-sm font-medium text-gray-900">{formatPrice(item.priceAtTimeOfAdd)} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-gray-900">{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import React from 'react';

export default function CheckoutPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Sign in to Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">Please sign in or create an account to complete your purchase.</p>
              <Link href="/auth/login?callbackUrl=/checkout">
                <Button className="w-full mb-3">Sign In</Button>
              </Link>
              <Link href="/auth/register?callbackUrl=/checkout">
                <Button variant="outline" className="w-full">Create Account</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}