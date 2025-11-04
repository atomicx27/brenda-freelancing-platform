import React from 'react';
import { FaGraduationCap, FaUserTie, FaCheckCircle, FaClock, FaBan, FaEye } from 'react-icons/fa';
import PropTypes from 'prop-types';

const MentorshipCard = ({ mentorship, currentUserId, onAccept, onReject, onViewDetails }) => {
  const {
    id,
    title,
    description,
    category,
    skills = [],
    status,
    mentor,
    mentee,
    mentorId,
    menteeId
  } = mentorship;

  // Determine if current user is mentor or mentee
  const isMentor = currentUserId === mentorId;
  const isMentee = currentUserId === menteeId;
  const otherUser = isMentor ? mentee : mentor;

  // Status badge configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'bg-green-100 text-green-800',
          icon: FaCheckCircle,
          label: 'Active'
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: FaClock,
          label: 'Pending'
        };
      case 'COMPLETED':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: FaCheckCircle,
          label: 'Completed'
        };
      case 'CANCELLED':
        return {
          color: 'bg-red-100 text-red-800',
          icon: FaBan,
          label: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: FaClock,
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Show accept/reject buttons only if:
  // 1. Status is PENDING
  // 2. Current user is the MENTOR (receiving the request)
  const showActionButtons = status === 'PENDING' && isMentor;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header with Category Badge */}
      {category && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3">
          <span className="text-white font-medium text-sm">{category}</span>
        </div>
      )}

      <div className="p-6">
        {/* Title and Status */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-4">{title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusConfig.label}</span>
          </span>
        </div>

        {/* Description */}
        {description && (
          <div className={`mb-4 ${showActionButtons ? 'bg-purple-50 border-l-4 border-purple-500 p-4 rounded' : ''}`}>
            {showActionButtons && (
              <p className="text-xs font-semibold text-purple-700 mb-2">📝 Personal Message:</p>
            )}
            <p className={`text-gray-600 ${showActionButtons ? '' : 'line-clamp-2'}`}>
              {description}
            </p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                  +{skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mentor/Mentee Info */}
        <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200">
          {/* Mentor */}
          <div className="flex items-center space-x-2 flex-1">
            <FaUserTie className="w-4 h-4 text-purple-600" />
            <div className="flex items-center space-x-2">
              {mentor.avatar ? (
                <img
                  src={mentor.avatar}
                  alt={`${mentor.firstName} ${mentor.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <FaUserTie className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className="text-sm">
                <p className="text-gray-500 text-xs">Mentor</p>
                <p className="font-medium text-gray-800">
                  {mentor.firstName} {mentor.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-gray-400">→</div>

          {/* Mentee */}
          <div className="flex items-center space-x-2 flex-1">
            <FaGraduationCap className="w-4 h-4 text-indigo-600" />
            <div className="flex items-center space-x-2">
              {mentee.avatar ? (
                <img
                  src={mentee.avatar}
                  alt={`${mentee.firstName} ${mentee.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FaGraduationCap className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div className="text-sm">
                <p className="text-gray-500 text-xs">Mentee</p>
                <p className="font-medium text-gray-800">
                  {mentee.firstName} {mentee.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {showActionButtons ? (
            <>
              <button
                onClick={() => onAccept(id)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FaCheckCircle />
                <span>Accept</span>
              </button>
              <button
                onClick={() => onReject(id)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FaBan />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onViewDetails(id)}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FaEye />
              <span>View Details</span>
            </button>
          )}
        </div>

        {/* Additional Info for Current User */}
        {isMentor && status === 'PENDING' && (
          <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
            {mentee.firstName} has requested you as a mentor
          </p>
        )}
        {isMentee && status === 'PENDING' && (
          <p className="mt-3 text-sm text-blue-700 bg-blue-50 p-2 rounded">
            Waiting for {mentor.firstName}'s approval
          </p>
        )}
      </div>
    </div>
  );
};

MentorshipCard.propTypes = {
  mentorship: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    status: PropTypes.oneOf(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).isRequired,
    mentor: PropTypes.shape({
      id: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      avatar: PropTypes.string
    }).isRequired,
    mentee: PropTypes.shape({
      id: PropTypes.string,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      avatar: PropTypes.string
    }).isRequired,
    mentorId: PropTypes.string.isRequired,
    menteeId: PropTypes.string.isRequired
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onAccept: PropTypes.func,
  onReject: PropTypes.func,
  onViewDetails: PropTypes.func
};

MentorshipCard.defaultProps = {
  onAccept: () => {},
  onReject: () => {},
  onViewDetails: () => {}
};

export default MentorshipCard;
