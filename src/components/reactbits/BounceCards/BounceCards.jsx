import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * BounceCards — a fan of cards that bounce in with an elastic spring;
 * hovering a card pushes its siblings aside (arena podium fan).
 * Vendored from ReactBits (JSX-ified, content cards instead of images).
 */

const getNoRotationTransform = (transformStr) => {
  const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
  if (hasRotate) {
    return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
  } else if (transformStr === 'none') {
    return 'rotate(0deg)';
  } else {
    return `${transformStr} rotate(0deg)`;
  }
};

const getPushedTransform = (baseTransform, offsetX) => {
  const translateRegex = /translate\(([-0-9.]+)px\)/;
  const match = baseTransform.match(translateRegex);
  if (match) {
    const currentX = parseFloat(match[1]);
    const newX = currentX + offsetX;
    return baseTransform.replace(translateRegex, `translate(${newX}px)`);
  } else {
    return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
  }
};

export default function BounceCards({
  className = '',
  cards = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = 'elastic.out(1, 0.8)',
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)',
  ],
  enableHover = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.card',
        { scale: 0 },
        {
          scale: 1,
          stagger: animationStagger,
          ease: easeType,
          delay: animationDelay,
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [animationDelay, animationStagger, easeType]);

  const pushSiblings = (hoveredIdx) => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);

    cards.forEach((_, i) => {
      const selector = q(`.card-${i}`);
      gsap.killTweensOf(selector);

      const baseTransform = transformStyles[i] || 'none';

      if (i === hoveredIdx) {
        gsap.to(selector, {
          transform: getNoRotationTransform(baseTransform),
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto',
        });
      } else {
        const offsetX = i < hoveredIdx ? -160 : 160;
        const distance = Math.abs(hoveredIdx - i);
        gsap.to(selector, {
          transform: getPushedTransform(baseTransform, offsetX),
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay: distance * 0.05,
          overwrite: 'auto',
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);

    cards.forEach((_, i) => {
      const selector = q(`.card-${i}`);
      gsap.killTweensOf(selector);
      gsap.to(selector, {
        transform: transformStyles[i] || 'none',
        duration: 0.4,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
      });
    });
  };

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      ref={containerRef}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`card card-${idx} absolute`}
          style={{
            transform: transformStyles[idx] || 'none',
            width: card.width || 200,
          }}
          onMouseEnter={() => pushSiblings(idx)}
          onMouseLeave={resetSiblings}
        >
          {card.content}
        </div>
      ))}
    </div>
  );
}
