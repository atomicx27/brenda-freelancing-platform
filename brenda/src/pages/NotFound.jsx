import React from 'react'
import { Link } from 'react-router-dom'
import HeadTag from '../components/HeadTag'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeadTag title="404 - Page Not Found"/>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-[#0C4A6E] mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
          <Link 
            to="/" 
            className="bg-[#0C4A6E] text-white px-6 py-3 rounded-lg hover:bg-[#0a3d5a] transition-colors"
          >
            Go Home
          </Link>
        </div>
      </main>
      
      <Footer/>
    </div>
  )
}



