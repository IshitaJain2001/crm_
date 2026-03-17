import React from 'react';
import { useTheme } from '../context/ThemeContext';

const withTheme = (Component) => {
  return (props) => {
    const { isDark } = useTheme();
    
    return (
      <div className={isDark ? 'bg-gray-900' : 'bg-white'}>
        <Component {...props} isDark={isDark} />
      </div>
    );
  };
};

export default withTheme;
