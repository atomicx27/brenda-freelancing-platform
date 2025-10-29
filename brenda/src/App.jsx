import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThreeDots } from 'react-loader-spinner'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Navbar from './components/Navbar/Navbar.jsx'

// Import pages
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Profile from './pages/Profile.jsx'
import Portfolio from './pages/Portfolio.jsx'
import CompanyProfile from './pages/CompanyProfile.jsx'
import Login from './pages/account-security/Login.jsx'
import Signup from './pages/account-security/Signup.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminAccess from './pages/AdminAccess.jsx'
import AdvancedSearchPage from './pages/AdvancedSearchPage.jsx'
import Community from './pages/Community.jsx'
import AutomationDashboard from './pages/AutomationDashboard.jsx'
import SmartContractGenerator from './pages/SmartContractGenerator.jsx'
import AllJobs from './pages/jobs/AllJobs.jsx'
import TodaysJobs from './pages/jobs/TodaysJobs.jsx'
import CreateJob from './pages/jobs/CreateJob.jsx'
import EditJob from './pages/jobs/EditJob.jsx'
import MyJobs from './pages/jobs/MyJobs.jsx'
import JobDetails from './pages/JobDetails.jsx'
import MyProposals from './pages/MyProposals.jsx'
import Chat from './pages/Chat.jsx'
import UserReviews from './pages/UserReviews.jsx'
import MyReviews from './pages/MyReviews.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FreelancerDashboard from './pages/FreelancerDashboard.jsx'
import ClientDashboard from './pages/ClientDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import HowToFindWork from './pages/HowToFindWork.jsx'
import HowToHire from './pages/HowToHire.jsx'
import Reviews from './pages/Reviews.jsx'
import SuccessStories from './pages/SuccessStories.jsx'
import TalentMarketplace from './pages/TalentMarketplace.jsx'
import Enterprise from './pages/enterprise/Enterprise.jsx'
import Hire from './pages/hire/Hire.jsx'

// Import category pages
import AdminCustomerSupport from './pages/cat/AdminCustomerSupport.jsx'
import DesignCreative from './pages/cat/DesignCreative.jsx'
import DevIt from './pages/cat/DevIt.jsx'
import EngineeringArchitecture from './pages/cat/EngineeringArchitecture.jsx'
import FinanceAccounting from './pages/cat/FinanceAccounting.jsx'
import HrTraining from './pages/cat/HrTraining.jsx'
import Legal from './pages/cat/Legal.jsx'
import SalesMarketing from './pages/cat/SalesMarketing.jsx'
import WritingTranslation from './pages/cat/WritingTranslation.jsx'

// Import service pages
import ServicesIndex from './pages/services/ServicesIndex.jsx'
import ArticlesBlogPosts from './pages/services/ArticlesBlogPosts.jsx'
import LogoDesign from './pages/services/LogoDesign.jsx'
import Seo from './pages/services/Seo.jsx'
import SocialMediaManagement from './pages/services/SocialMediaManagement.jsx'
import VideoEditing from './pages/services/VideoEditing.jsx'
import WordPress from './pages/services/WordPress.jsx'

// Import staffing pages
import StaffingIndex from './pages/staffing/StaffingIndex.jsx'
import StaffingDesignCreative from './pages/staffing/StaffingDesignCreative.jsx'
import StaffingDevelopment from './pages/staffing/StaffingDevelopment.jsx'
import StaffingMarketing from './pages/staffing/StaffingMarketing.jsx'

// Import 404 page
import NotFound from './pages/NotFound.jsx'

// Route Loading Component
function RouteLoading() {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);
  
  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => {
      setRouteLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return routeLoading && (
    <div className='h-full w-full flex justify-center align-center fixed top-0 left-0 bg-[#F3FFFC] z-30'>
       <div className='absolute flex flex-col justify-center align-center h-full mx-0 my-auto'>
        <ThreeDots 
              height={80}
              width={80}
              radius="9"
              color="#a3beb6" 
              ariaLabel="three-dots-loading"              
              visible={true}
            />
      </div>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <RouteLoading />
          <Navbar />
          <Routes>
        {/* Main Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/talent-marketplace" element={<TalentMarketplace />} />
        <Route path="/how-to-find-work" element={<HowToFindWork />} />
        <Route path="/how-to-hire" element={<HowToHire />} />
        
        {/* Account Security Routes */}
        <Route path="/account-security/login" element={<Login />} />
        <Route path="/account-security/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminAccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/search" element={<AdvancedSearchPage />} />
        <Route path="/community" element={<Community />} />
        <Route path="/automation" element={<AutomationDashboard />} />
  <Route path="/automation/contracts/new" element={<SmartContractGenerator />} />
        
        {/* Profile Route */}
        <Route path="/profile" element={<Profile />} />
        
        {/* Portfolio Route */}
        <Route path="/portfolio" element={<Portfolio />} />
        
        {/* Company Profile Route */}
        <Route path="/company" element={<CompanyProfile />} />
        
        {/* Jobs Routes */}
        <Route path="/jobs/all-jobs" element={<AllJobs />} />
        <Route path="/jobs/todays-jobs" element={<TodaysJobs />} />
        <Route path="/jobs/create" element={<CreateJob />} />
        <Route path="/jobs/edit/:id" element={<EditJob />} />
        <Route path="/jobs/my-jobs" element={<MyJobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        
        {/* Proposals Routes */}
        <Route path="/proposals" element={<MyProposals />} />
        
        {/* Messages Routes */}
        <Route path="/messages" element={<Chat />} />
        <Route path="/messages/:userId" element={<Chat />} />
        
        {/* Reviews Routes */}
        <Route path="/reviews/user/:userId" element={<UserReviews />} />
        <Route path="/reviews/my-reviews" element={<MyReviews />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
        <Route path="/dashboard/client" element={<ClientDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        
        {/* Enterprise & Hire Routes */}
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/hire" element={<Hire />} />
        
        {/* Category Routes */}
        <Route path="/cat/admin-customer-support" element={<AdminCustomerSupport />} />
        <Route path="/cat/design-creative" element={<DesignCreative />} />
        <Route path="/cat/dev-it" element={<DevIt />} />
        <Route path="/cat/engineering-architecture" element={<EngineeringArchitecture />} />
        <Route path="/cat/finance-accounting" element={<FinanceAccounting />} />
        <Route path="/cat/hr-training" element={<HrTraining />} />
        <Route path="/cat/legal" element={<Legal />} />
        <Route path="/cat/sales-marketing" element={<SalesMarketing />} />
        <Route path="/cat/writing-translation" element={<WritingTranslation />} />
        
        {/* Services Routes */}
        <Route path="/services" element={<ServicesIndex />} />
        <Route path="/services/articles-blog-posts" element={<ArticlesBlogPosts />} />
        <Route path="/services/logo-design" element={<LogoDesign />} />
        <Route path="/services/seo" element={<Seo />} />
        <Route path="/services/social-media-management" element={<SocialMediaManagement />} />
        <Route path="/services/video-editing" element={<VideoEditing />} />
        <Route path="/services/wordpress" element={<WordPress />} />
        
        {/* Staffing Routes */}
        <Route path="/staffing" element={<StaffingIndex />} />
        <Route path="/staffing/design-creative" element={<StaffingDesignCreative />} />
        <Route path="/staffing/development" element={<StaffingDevelopment />} />
        <Route path="/staffing/marketing" element={<StaffingMarketing />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
