import React from 'react';

const Avatar = ({ username, size = 40, className = "" }) => {
  const getAvatarUrl = (username) => {
    // Trim the username and then encode it to support Thai characters
    const seed = encodeURIComponent(username.trim());
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&size=${size}`;
  };

  return (
    <img
      src={getAvatarUrl(username)}
      alt={`${username} avatar`}
      className={`rounded ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
