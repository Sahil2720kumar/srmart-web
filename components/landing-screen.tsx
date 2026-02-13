'use client'
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export  function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform group-hover:rotate-[-5deg]">
                <span className="text-2xl">🛒</span>
              </div>
              <span className="text-2xl font-bold text-foreground">FreshMart</span>
            </a>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-10">
              <li><a href="#features" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Features</a></li>
              <li><a href="#categories" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Categories</a></li>
              <li><a href="#how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#screenshots" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">App</a></li>
              <li>
                <Button size="lg" className="rounded-full shadow-lg">
                  Download Now
                </Button>
              </li>
            </ul>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex flex-col gap-1.5 p-2"
            >
              <span className={`w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-6 border-t border-border animate-in slide-in-from-top-2">
              <ul className="flex flex-col gap-4">
                <li><a href="#features" className="text-sm font-semibold text-muted-foreground hover:text-primary">Features</a></li>
                <li><a href="#categories" className="text-sm font-semibold text-muted-foreground hover:text-primary">Categories</a></li>
                <li><a href="#how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-primary">How It Works</a></li>
                <li><a href="#screenshots" className="text-sm font-semibold text-muted-foreground hover:text-primary">App</a></li>
                <li><Button size="lg" className="w-full rounded-full">Download Now</Button></li>
              </ul>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28 bg-background">

        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Text */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-10 duration-700">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold">
                <span>🎉</span>
                Multi-Vendor Marketplace
              </Badge>

              <h1 className="text-5xl lg:text-7xl font-black leading-tight">
                Shop <span className="text-primary">Everything</span> from Local Vendors
              </h1>

              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Groceries, fresh produce, meat, packaged foods & more. Compare prices from 2000+ verified local vendors and get delivered in 15 minutes.
              </p>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#" className="inline-flex items-center gap-4 px-6 py-4 bg-card border-2 border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all group">
                  <span className="text-4xl">🍎</span>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Download on the</p>
                    <p className="text-base font-bold">App Store</p>
                  </div>
                </a>
                <a href="#" className="inline-flex items-center gap-4 px-6 py-4 bg-card border-2 border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all group">
                  <span className="text-4xl">🤖</span>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">GET IT ON</p>
                    <p className="text-base font-bold">Google Play</p>
                  </div>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="space-y-2">
                  <h3 className="text-4xl lg:text-5xl font-black text-primary">50K+</h3>
                  <p className="text-sm font-semibold text-muted-foreground">Happy Customers</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-4xl lg:text-5xl font-black text-primary">2000+</h3>
                  <p className="text-sm font-semibold text-muted-foreground">Local Vendors</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-4xl lg:text-5xl font-black text-primary">15min</h3>
                  <p className="text-sm font-semibold text-muted-foreground">Fast Delivery</p>
                </div>
              </div>
            </div>

            {/* Hero Image - Phone Mockup */}
            <div className="relative animate-in fade-in slide-in-from-right-10 duration-700 delay-200">
              <div className="relative max-w-[380px] mx-auto animate-in zoom-in duration-1000 delay-500">
                {/* Phone Frame */}
                <div className="relative bg-muted rounded-[3rem] p-3 shadow-2xl border-8 border-muted-foreground/30">
                  {/* Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-card rounded-full z-10" />
                  
                  {/* Screen */}
                  <div className="relative bg-card rounded-[2.5rem] aspect-[9/19.5] overflow-hidden">
                    {/* Placeholder */}
                    <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-6 p-8">
                      <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-lg animate-bounce">
                        <span className="text-5xl">🛒</span>
                      </div>
                      <p className="text-center text-sm font-semibold text-muted-foreground">
                        Your App Screenshot<br />Goes Here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              🛍️ SHOP BY CATEGORY
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black">Everything You Need</h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Browse from a wide range of categories - all from verified local vendors
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🥬', title: 'Fresh Vegetables', desc: 'Farm-fresh vegetables delivered daily from local farmers' },
              { icon: '🍎', title: 'Fresh Fruits', desc: 'Seasonal fruits handpicked for quality and freshness' },
              { icon: '🥩', title: 'Meat & Seafood', desc: 'Premium quality meat and fresh seafood from trusted vendors' },
              { icon: '📦', title: 'Packaged Foods', desc: 'All your favorite brands and pantry essentials in one place' },
              { icon: '🥛', title: 'Dairy Products', desc: 'Fresh milk, cheese, yogurt and more dairy essentials' },
              { icon: '🍞', title: 'Bakery Items', desc: 'Fresh bread, cakes and baked goods from local bakeries' },
            ].map((category, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary hover:-translate-y-2"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-3xl bg-primary/15 flex items-center justify-center text-5xl group-hover:scale-110 group-hover:rotate-[-5deg] transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{category.title}</h3>
                  <p className="text-muted-foreground">{category.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              ✨ WHY CHOOSE US
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black">
              Shop Smarter, <span className="text-primary">Save More</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for a seamless grocery shopping experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: '15-Min Delivery', desc: 'Lightning-fast delivery to your doorstep. Order now, receive in 15 minutes - guaranteed!' },
              { icon: '🏪', title: 'Multi-Vendor Platform', desc: 'Shop from 2000+ verified local vendors. Compare prices and choose the best deals.' },
              { icon: '💰', title: 'Best Prices', desc: 'Daily deals, exclusive offers and vendor-specific discounts. Save on every order!' },
              { icon: '✅', title: 'Quality Assured', desc: 'Every product verified for quality and freshness by our expert team daily.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Multiple payment options with bank-grade security. Shop with confidence!' },
              { icon: '❤️', title: 'Support Local', desc: 'Every purchase helps local vendors and farmers grow their businesses.' },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary hover:-translate-y-2"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              📱 GETTING STARTED
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in just 4 simple steps
            </p>
          </div>

          <div className="relative">
            {/* Connection Line - Hidden on mobile */}
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-1 bg-primary" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
              {[
                { num: '1', title: 'Download App', desc: 'Get FreshMart from App Store or Google Play Store in seconds' },
                { num: '2', title: 'Browse & Compare', desc: 'Explore products from multiple vendors and compare prices' },
                { num: '3', title: 'Place Order', desc: 'Add items to cart and checkout with secure payment' },
                { num: '4', title: 'Fast Delivery', desc: 'Track your order and receive fresh groceries in 15 minutes' },
              ].map((step, index) => (
                <div key={index} className="relative text-center group">
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-10" />
                    <div className="relative w-28 h-28 bg-primary rounded-full flex items-center justify-center text-5xl font-black text-primary-foreground shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-transform border-4 border-background">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App Screenshots */}
      <section id="screenshots" className="py-20 lg:py-28 bg-primary/8">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              📸 APP PREVIEW
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black">
              Beautiful, <span className="text-primary">Intuitive</span> Design
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our easy-to-use app interface designed for seamless shopping
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🏠', label: 'Home Screen' },
              { icon: '🔍', label: 'Browse Products' },
              { icon: '🛒', label: 'Shopping Cart' },
            ].map((screenshot, index) => (
              <div
                key={index}
                className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-3 hover:scale-105 aspect-[9/19.5]"
              >
                {/* Placeholder */}
                <div className="w-full h-full bg-card flex flex-col items-center justify-center gap-6 p-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg text-4xl">
                    {screenshot.icon}
                  </div>
                  <p className="text-center text-sm font-semibold text-muted-foreground">
                    {screenshot.label}<br />Screenshot
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              💬 TESTIMONIALS
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black">
              Loved by <span className="text-primary">50,000+</span> Customers
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our happy customers have to say about us
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Priya Sharma', location: 'Mumbai, India', initial: 'PS', review: 'Best grocery app I\'ve used! The ability to compare prices from different vendors saves me so much money. Delivery is super fast too!' },
              { name: 'Rahul Kumar', location: 'Delhi, India', initial: 'RK', review: 'Finally, a platform that supports local vendors! The meat and seafood quality is amazing. Love that I can support small businesses.' },
              { name: 'Anjali Mehta', location: 'Bangalore, India', initial: 'AM', review: '15-minute delivery is a game changer! Fresh vegetables and fruits delivered so quickly. The app is very easy to use too.' },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary hover:-translate-y-2"
              >
                <div className="space-y-6">
                  <div className="flex gap-1 text-2xl text-accent">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed">{testimonial.review}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                      {testimonial.initial}
                    </div>
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-primary to-accent overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black text-primary-foreground">
              Start Shopping Fresh Today!
            </h2>
            <p className="text-xl lg:text-2xl text-primary-foreground/95">
              Join 50,000+ happy customers. Download now and get ₹100 off on your first order!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a href="#" className="inline-flex items-center gap-4 px-6 py-4 bg-background rounded-2xl hover:shadow-2xl transition-all group">
                <span className="text-4xl">🍎</span>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Download on the</p>
                  <p className="text-base font-bold text-foreground">App Store</p>
                </div>
              </a>
              <a href="#" className="inline-flex items-center gap-4 px-6 py-4 bg-background rounded-2xl hover:shadow-2xl transition-all group">
                <span className="text-4xl">🤖</span>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">GET IT ON</p>
                  <p className="text-base font-bold text-foreground">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2 space-y-6">
              <a href="#" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                  <span className="text-2xl">🛒</span>
                </div>
                <span className="text-2xl font-bold">FreshMart</span>
              </a>
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                Your trusted multi-vendor grocery marketplace. Fresh produce, meat, packaged foods and more delivered in 15 minutes.
              </p>
              <div className="flex gap-3">
                {['📘', '📷', '🐦', '💼'].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-11 h-11 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors"
                  >
                    <span className="text-xl">{icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Categories', 'Pricing', 'Download App'] },
              { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Press Kit'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Track Order', 'FAQs'] },
            ].map((section, index) => (
              <div key={index} className="space-y-4">
                <h4 className="font-bold text-lg">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 FreshMart. All rights reserved. Made with ❤️ for local vendors.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
