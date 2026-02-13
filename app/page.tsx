'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Star, ShoppingCart, Truck, Clock, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

const categories = ["All", "Fruits", "Vegetables", "Milk & Eggs", "Cakes", "Ice-Cream"];
const allProducts = [
  { name: "Strawberry", cat: "Fruits", price: "$10.00", rating: 4.8 },
  { name: "Papaya", cat: "Fruits", price: "$10.00", rating: 4.8 },
  { name: "Watermelon", cat: "Fruits", price: "$10.00", rating: 4.8 },
  { name: "Carrot", cat: "Vegetables", price: "$5.00", rating: 4.6 },
  { name: "Broccoli", cat: "Vegetables", price: "$8.00", rating: 4.7 },
  { name: "Spinach", cat: "Vegetables", price: "$6.00", rating: 4.5 },
];

export default function Page() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  
  const filteredProducts = activeCategory === 0 
    ? allProducts 
    : allProducts.filter(p => p.cat === categories[activeCategory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              G
            </motion.div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">Grocery.</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {["Home", "Features", "How It Works", "Products", "Testimonials"].map((item, i) => (
              <motion.a
                key={i}
                href="#"
                className="text-gray-700 hover:text-green-500 transition font-medium text-sm"
                whileHover={{ y: -2 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            className="flex-shrink-0"
          >
            <Button className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl shadow-lg">
              Get the App
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-12 items-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants}>
          <motion.div 
            className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-6 text-xs sm:text-sm"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold">The Best Online Grocery Store</span>
          </motion.div>
          
          <motion.h1 
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
            variants={itemVariants}
          >
            Your <span className="text-green-500">Online Grocery</span> Superstore is Here!
          </motion.h1>
          
          <motion.p 
            className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Fresh groceries delivered to your doorstep. Enjoy exclusive discounts, fast delivery, and quality products every day.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12"
            variants={itemVariants}
          >
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              className="w-full sm:w-auto"
            >
              <Button className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl w-full shadow-lg flex items-center justify-center gap-2">
                <img src="/placeholder.svg?height=20&width=100" alt="Google Play" className="h-4 sm:h-5" />
                <span className="text-sm sm:text-base">Get it on Google Play</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
              className="w-full sm:w-auto"
            >
              <Button className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl w-full shadow-lg flex items-center justify-center gap-2">
                <img src="/placeholder.svg?height=20&width=100" alt="App Store" className="h-4 sm:h-5" />
                <span className="text-sm sm:text-base">Download on App Store</span>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8"
            variants={itemVariants}
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-300 to-green-500 rounded-full border-2 border-white shadow-md"
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">5M +</p>
              <p className="text-gray-600 font-medium text-sm sm:text-base">Active Users</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="hidden md:flex relative h-64 sm:h-80 md:h-full md:min-h-[500px] bg-gradient-to-br from-green-100 to-green-50 rounded-2xl sm:rounded-3xl items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.img 
            src="/placeholder.svg?height=500&width=300" 
            alt="Mobile App"
            className="h-48 sm:h-64 md:h-96 w-auto"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.section>

      {/* Download Section */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-8 md:mb-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                Download <span className="text-green-500">Our Online Grocery</span> Mobile App
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8">
                Get exclusive deals, faster checkout, and real-time order tracking on our mobile app.
              </p>

              <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {[
                  { num: "5M+", label: "Active Users" },
                  { num: "1250+", label: "Categories" },
                  { num: "8000+", label: "Products" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{stat.num}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 gap-4 sm:gap-6"
              variants={containerVariants}
            >
              {[
                { os: "iOS", version: "iOS 15.6+", icon: "📱" },
                { os: "Android", version: "Android 8.0+", icon: "🤖" },
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Card className="bg-gray-800 border-gray-700 p-4 sm:p-6 text-center hover:border-green-500 transition flex flex-col h-full">
                    <p className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">For {item.os}</p>
                    <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">{item.version}</p>
                    <motion.div
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                      className="mb-3 sm:mb-6"
                    >
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-4 sm:py-5 font-semibold rounded-lg text-sm sm:text-base">
                        Download App
                      </Button>
                    </motion.div>
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-700 rounded-lg mx-auto mb-3 sm:mb-4 flex-shrink-0" />
                    <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 mx-auto" />
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        id="features" 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className="text-center mb-10 sm:mb-16" variants={itemVariants}>
          <p className="text-green-500 font-semibold mb-2 text-sm sm:text-base">EXCLUSIVE BENEFITS</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Exclusive Benefits of <span className="text-green-500">Grocery App</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {[
            { icon: Clock, title: "Order Tracking", desc: "Real-time tracking of your grocery orders" },
            { icon: Shield, title: "Secure Payments", desc: "Safe and encrypted payment methods" },
            { icon: Star, title: "Exclusive Offers", desc: "Special deals and discounts daily" },
            { icon: Truck, title: "24x7 Support", desc: "Customer support available anytime" },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              className="text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-50 to-transparent hover:shadow-xl transition"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                whileHover={{ scale: 1.1 }}
              >
                <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <p className="text-green-500 font-semibold mb-2 text-sm sm:text-base">HOW IT WORKS</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                Here's How Grocery <span className="text-green-500">Delivery App</span> Works
              </h2>
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
                Simple, quick, and easy ordering process to get your groceries delivered to your home.
              </p>
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
              >
                <Button className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-semibold rounded-lg sm:rounded-xl">
                  Download App Now
                </Button>
              </motion.div>
            </motion.div>

            <motion.div className="space-y-4 sm:space-y-6" variants={containerVariants}>
              {[
                { step: "1", title: "User Registration", desc: "Sign up with your phone number" },
                { step: "2", title: "Exploring Grocery", desc: "Browse through thousands of products" },
                { step: "3", title: "Placing an Order", desc: "Add items to cart and checkout" },
                { step: "4", title: "Track Orders", desc: "Monitor delivery in real-time" },
              ].map((item, i) => (
                <motion.div key={i} className="flex gap-3 sm:gap-4" variants={itemVariants}>
                  <motion.div 
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm sm:text-lg shadow-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    {item.step}
                  </motion.div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white mb-1 text-base sm:text-lg">{item.title}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <motion.section 
        id="testimonials" 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className="text-center mb-10 sm:mb-16" variants={itemVariants}>
          <p className="text-green-500 font-semibold mb-2 text-sm sm:text-base">TESTIMONIAL</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Our Customer <span className="text-green-500">Testimonials</span>
          </h2>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-green-50 to-gray-100 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-xl"
          variants={itemVariants}
        >
          <div className="flex justify-center gap-2 sm:gap-4 mb-6 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-md flex-shrink-0"
                whileHover={{ scale: 1.1 }}
              />
            ))}
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Shane Lee</h3>
          <p className="text-gray-600 mb-4 font-medium text-sm sm:text-base">Satisfied Customer</p>
          
          <div className="flex justify-center gap-1 sm:gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.2 }}
              >
                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
              </motion.div>
            ))}
          </div>

          <p className="text-gray-700 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            "I've been using this grocery delivery app for several months now, and I'm continually impressed with the service it provides. As a busy professional, I value convenience, and this app delivers that in spades."
          </p>
        </motion.div>
      </motion.section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
        <motion.div 
          className="mb-8 sm:mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <p className="text-green-500 font-semibold mb-2 text-sm sm:text-base">BEST SELLER</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Our Best Seller <span className="text-green-500">Grocery Products</span>
            </h2>
          </motion.div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div 
          className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-12 overflow-x-auto pb-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex-shrink-0"
            >
              <Button
                onClick={() => setActiveCategory(i)}
                className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 font-semibold text-xs sm:text-sm lg:text-base rounded-lg sm:rounded-xl transition whitespace-nowrap ${
                  activeCategory === i
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                    : "bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-500"
                }`}
              >
                {cat}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredProducts.map((product, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              onMouseEnter={() => setHoveredProduct(i)}
              onMouseLeave={() => setHoveredProduct(null)}
              whileHover={{ y: -8 }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition cursor-pointer border-0 h-full flex flex-col">
                <motion.div 
                  className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 sm:h-40 md:h-48 flex items-center justify-center relative flex-shrink-0"
                  animate={hoveredProduct === i ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src="/placeholder.svg?height=200&width=200" alt={product.name} className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32" />
                </motion.div>
                <div className="p-4 sm:p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2">
                    <motion.span 
                      className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 sm:px-4 sm:py-2 rounded-full flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                    >
                      {product.cat}
                    </motion.span>
                    <motion.div 
                      className="flex items-center gap-1 flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">{product.rating}</span>
                    </motion.div>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 line-clamp-2">{product.name}</h3>
                  <motion.div
                    className="flex items-center justify-between gap-2 mt-auto"
                    animate={hoveredProduct === i ? { gap: 8 } : { gap: 0 }}
                  >
                    <p className="text-green-500 font-bold text-xl sm:text-2xl">{product.price}</p>
                    <motion.div
                      animate={hoveredProduct === i ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg font-semibold flex-shrink-0">
                        Add
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-10 sm:mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={itemVariants}
        >
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Button className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-10 py-4 sm:py-7 text-sm sm:text-lg font-semibold rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-2 mx-auto">
              View All Products <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Blog Section */}
      <motion.section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div className="mb-8 sm:mb-12" variants={itemVariants}>
          <p className="text-green-500 font-semibold mb-2 text-sm sm:text-base">BLOGS & NEWS</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Our Latest <span className="text-green-500">Blog</span> & News
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}>
              <Card className="overflow-hidden hover:shadow-xl transition cursor-pointer border-0 h-full flex flex-col">
                <div className="bg-gray-300 h-32 sm:h-40 flex-shrink-0" />
                <div className="p-4 sm:p-6 flex-grow flex flex-col">
                  <motion.span 
                    className="text-xs font-semibold text-green-600 bg-green-50 px-3 sm:px-4 py-1 sm:py-2 rounded-full mb-2 sm:mb-3 inline-block flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    Grocery Delivery App
                  </motion.span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">Top 10 Reasons to Choose Our Grocery Delivery App</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-auto">by Admin • 23 Sep, 2023</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="bg-green-500 text-white py-12 sm:py-16 md:py-24 mx-4 sm:mx-6 lg:mx-8 rounded-2xl sm:rounded-3xl mb-12 sm:mb-16 shadow-2xl"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <motion.p 
            className="font-semibold mb-2 text-sm sm:text-base lg:text-lg"
            variants={itemVariants}
          >
            Your Source for Budget-Friendly Grocery Delivery
          </motion.p>
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Download the App Now!
          </motion.h2>
          <motion.p 
            className="text-green-100 mb-8 sm:mb-10 text-sm sm:text-base lg:text-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Get exclusive deals and fast delivery right to your doorstep
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full sm:w-auto"
            >
              <Button className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-4 sm:py-6 font-semibold rounded-lg sm:rounded-xl w-full sm:w-auto text-sm sm:text-base shadow-lg">
                GET IT ON Google Play
              </Button>
            </motion.div>
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full sm:w-auto"
            >
              <Button className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 py-4 sm:py-6 font-semibold rounded-lg sm:rounded-xl w-full sm:w-auto text-sm sm:text-base shadow-lg">
                Download on App Store
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">G</div>
                <span className="text-xl font-bold text-white">Grocery.</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your trusted online grocery store for fresh products and fast delivery.
              </p>
            </motion.div>

            {[
              {
                title: "Company",
                links: ["Home", "Features", "Services", "About Us"]
              },
              {
                title: "Contact",
                links: ["(406) 555-0120", "www.example.com", "example@gmail.com", "58, Bajar Goli, Amborkhana, Sylhet"]
              }
            ].map((col, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <h3 className="font-bold text-white mb-4">{col.title}</h3>
                <ul className="space-y-2 text-sm">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-green-500 transition">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="font-bold text-white mb-4">Get the latest information</h3>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-gray-800 text-white px-4 py-3 rounded-lg flex-1 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <p>Copyright © 2024 Grocery. All Rights Reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-green-500 transition">User Terms & Conditions</a>
              <a href="#" className="hover:text-green-500 transition">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
