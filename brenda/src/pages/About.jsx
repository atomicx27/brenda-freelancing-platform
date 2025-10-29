import React from 'react'
import HeadTag from '../components/HeadTag'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeadTag title="About - Brenda"/>
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-[#0C4A6E] mb-6">About Brenda</h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Brenda is the world's work marketplace, connecting talented freelancers with businesses 
            that need their skills. We make it easy to find the right talent for any project, 
            from quick turnarounds to big transformations.
          </p>
        </div>
      </main>
      
      <Footer/>
    </div>
  )
}



