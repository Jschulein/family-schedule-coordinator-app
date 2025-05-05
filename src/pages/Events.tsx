
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This is a temporary solution - we'll redirect Events page to Calendar
const Events = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  
  return <div>Redirecting to calendar...</div>;
};

export default Events;
