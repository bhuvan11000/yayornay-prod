import React from 'react';

const StarBorder = ({
  as,
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  contentClassName = '',
  children,
  ...rest
}) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden ${className}`}
      {...rest}
      style={{
        padding: `${thickness}px 0`,
        ...(rest.style || {})
      }}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div className={`relative z-1 ${contentClassName}`}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
