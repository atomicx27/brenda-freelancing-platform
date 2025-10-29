import React from 'react'
import HeadTag from '../components/HeadTag.jsx'
import Navbar from '../components/Navbar/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function SuccessStories() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeadTag title="Success Stories - Brenda"/>
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-[#0C4A6E] mb-6">Success Stories</h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Discover success stories from our community.
          </p>
        </div>
      </main>
      
      <Footer/>
    </div>
  )
}