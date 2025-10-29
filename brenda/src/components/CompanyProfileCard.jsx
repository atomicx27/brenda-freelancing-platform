import React from 'react'
import { FaBuilding, FaGlobe, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaIndustry, FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaEdit, FaStar, FaEye, FaEyeSlash } from 'react-icons/fa'

const CompanyProfileCard = ({ 
  profile, 
  onEdit, 
  onToggleVisibility,
  isOwner = false 
}) => {
  const formatFoundedYear = (year) => {
    if (!year) return null
    return new Date().getFullYear() - year
  }

  const getCompanySizeText = (size) => {
    if (!size) return null
    return `${size} employees`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={profile.companyName}
                className="w-16 h-16 rounded-lg object-cover bg-white p-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                <FaBuilding className="text-2xl" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{profile.companyName}</h2>
              {profile.tagline && (
                <p className="text-blue-100 mt-1">{profile.tagline}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm">
                {profile.industry && (
                  <span className="flex items-center space-x-1">
                    <FaIndustry className="text-xs" />
                    <span>{profile.industry}</span>
                  </span>
                )}
                {profile.companySize && (
                  <span className="flex items-center space-x-1">
                    <FaUsers className="text-xs" />
                    <span>{getCompanySizeText(profile.companySize)}</span>
                  </span>
                )}
                {profile.foundedYear && (
                  <span className="flex items-center space-x-1">
                    <FaCalendarAlt className="text-xs" />
                    <span>Founded {profile.foundedYear} ({formatFoundedYear(profile.foundedYear)} years ago)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleVisibility(profile.id)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  profile.isPublic 
                    ? 'text-green-300 hover:text-green-100' 
                    : 'text-yellow-300 hover:text-yellow-100'
                }`}
                title={profile.isPublic ? 'Make private' : 'Make public'}
              >
                {profile.isPublic ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
              </button>
              <button
                onClick={() => onEdit(profile)}
                className="p-2 text-white hover:text-blue-200 rounded-full transition-colors duration-200"
                title="Edit company profile"
              >
                <FaEdit className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Description */}
        {profile.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About Us</h3>
            <p className="text-gray-700 leading-relaxed">{profile.description}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2">
              {profile.website && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaGlobe className="text-sm" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors duration-200"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaPhone className="text-sm" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaEnvelope className="text-sm" />
                  <a
                    href={`mailto:${profile.email}`}
                    className="hover:text-blue-600 transition-colors duration-200"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.headquarters && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaMapMarkerAlt className="text-sm" />
                  <span>{profile.headquarters}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Follow Us</h3>
            <div className="flex space-x-4">
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  title="LinkedIn"
                >
                  <FaLinkedin className="text-xl" />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={profile.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                  title="Twitter"
                >
                  <FaTwitter className="text-xl" />
                </a>
              )}
              {profile.facebook && (
                <a
                  href={profile.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  title="Facebook"
                >
                  <FaFacebook className="text-xl" />
                </a>
              )}
              {profile.instagram && (
                <a
                  href={profile.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-600 transition-colors duration-200"
                  title="Instagram"
                >
                  <FaInstagram className="text-xl" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Company Values */}
        {profile.values && profile.values.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Values</h3>
            <div className="flex flex-wrap gap-2">
              {profile.values.map((value, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  <FaStar className="mr-1 text-xs" />
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Company Culture */}
        {profile.culture && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Culture</h3>
            <p className="text-gray-700 leading-relaxed">{profile.culture}</p>
          </div>
        )}

        {/* Benefits */}
        {profile.benefits && profile.benefits.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {profile.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What We're Looking For */}
        {profile.lookingFor && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What We're Looking For</h3>
            <p className="text-gray-700 leading-relaxed">{profile.lookingFor}</p>
          </div>
        )}

        {/* Skills Needed */}
        {profile.skillsNeeded && profile.skillsNeeded.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills We Commonly Need</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skillsNeeded.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Project Types */}
        {profile.projectTypes && profile.projectTypes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Types We Post</h3>
            <div className="flex flex-wrap gap-2">
              {profile.projectTypes.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Company Statistics */}
        {profile.showStats && (profile.totalProjects > 0 || profile.activeProjects > 0) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.totalProjects}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{profile.activeProjects}</div>
                <div className="text-sm text-gray-600">Active Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${profile.totalSpent?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">${profile.avgProjectValue?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-600">Avg Project Value</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyProfileCard
