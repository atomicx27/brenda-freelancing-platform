import React from 'react'
import HeadTag from '../components/HeadTag'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer'

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeadTag title="Contact - Brenda"/>
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-[#0C4A6E] mb-6">Contact Us</h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Get in touch with our team for any questions or support needs.
          </p>
        </div>
      </main>
      
      <Footer/>
    </div>
  )
}



