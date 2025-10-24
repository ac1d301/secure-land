import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'verified' | 'rejected' | 'archived' | 'tampered' | 'unavailable' | 'not_recorded';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-green-100 text-green-800', 
    rejected: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
    tampered: 'bg-red-100 text-red-800 ring-1 ring-red-200',
    unavailable: 'bg-orange-100 text-orange-800',
    not_recorded: 'bg-yellow-100 text-yellow-800'
  };

  const classes = `${baseClasses} ${sizes[size]} ${variants[status]}`;

  return (
    <span className={classes}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
