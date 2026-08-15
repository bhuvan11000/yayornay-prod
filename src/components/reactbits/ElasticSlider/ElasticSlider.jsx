import React, { useEffect, useRef, useState, useCallback } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';

const MAX_OVERFLOW = 50;

/**
 * ElasticSlider — fully-controlled when `value` prop is provided,
 * uncontrolled (defaultValue) otherwise.
 *
 * Props:
 *   value?        — controlled value; overrides internal state when supplied
 *   defaultValue  — initial value for uncontrolled mode
 *   startingValue — minimum value
 *   maxValue      — maximum value
 *   isStepped     — snap to stepSize increments
 *   stepSize      — step size when isStepped is true
 *   onChange      — (newValue: number) => void
 *   leftIcon      — React node rendered to the left of the track
 *   rightIcon     — React node rendered to the right of the track
 *   className     — applied to the outer wrapper div
 */
const ElasticSlider = ({
  value: controlledValue,
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  onChange,
  leftIcon = <>-</>,
  rightIcon = <>+</>,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 w-full ${className}`}>
      <Slider
        value={controlledValue}
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        onChange={onChange}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
      />
    </div>
  );
};

const Slider = ({
  value: controlledValue,
  defaultValue,
  startingValue,
  maxValue,
  isStepped,
  stepSize,
  onChange,
  leftIcon,
  rightIcon,
}) => {
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState(
    isControlled ? controlledValue : defaultValue
  );

  // Sync internal state when controlled value changes from outside
  useEffect(() => {
    if (isControlled) {
      setInternalValue(controlledValue);
    }
  }, [isControlled, controlledValue]);

  // Sync internal state when defaultValue changes (uncontrolled re-key)
  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [isControlled, defaultValue]);

  const value = isControlled ? controlledValue : internalValue;

  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  const clampAndStep = useCallback(
    (raw) => {
      let v = isStepped ? Math.round(raw / stepSize) * stepSize : raw;
      v = Math.min(Math.max(v, startingValue), maxValue);
      // Round to avoid floating-point noise
      return Math.round(v * 10000) / 10000;
    },
    [isStepped, stepSize, startingValue, maxValue]
  );

  useMotionValueEvent(clientX, 'change', (latest) => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;
      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }
      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = (e) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      const raw = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);
      const next = clampAndStep(raw);
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = (e) => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return Math.min(100, Math.max(0, ((value - startingValue) / totalRange) * 100));
  };

  return (
    <motion.div
      onHoverStart={() => animate(scale, 1.2)}
      onHoverEnd={() => animate(scale, 1)}
      onTouchStart={() => animate(scale, 1.2)}
      onTouchEnd={() => animate(scale, 1)}
      style={{
        scale,
        opacity: useTransform(scale, [1, 1.2], [0.7, 1]),
      }}
      className="flex w-full touch-none select-none items-center justify-center gap-4"
    >
      <motion.div
        animate={{
          scale: region === 'left' ? [1, 1.4, 1] : 1,
          transition: { duration: 0.25 },
        }}
        style={{
          x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0)),
        }}
      >
        {leftIcon}
      </motion.div>

      <div
        ref={sliderRef}
        className="relative flex w-full flex-grow cursor-grab touch-none select-none items-center py-4"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <motion.div
          style={{
            scaleX: useTransform(() => {
              if (sliderRef.current) {
                const { width } = sliderRef.current.getBoundingClientRect();
                return 1 + overflow.get() / width;
              }
              return 1;
            }),
            scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
            transformOrigin: useTransform(() => {
              if (sliderRef.current) {
                const { left, width } = sliderRef.current.getBoundingClientRect();
                return clientX.get() < left + width / 2 ? 'right' : 'left';
              }
              return 'center';
            }),
            height: useTransform(scale, [1, 1.2], [6, 12]),
            marginTop: useTransform(scale, [1, 1.2], [0, -3]),
            marginBottom: useTransform(scale, [1, 1.2], [0, -3]),
          }}
          className="flex flex-grow"
        >
          <div className="relative h-full flex-grow overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            <div
              className="absolute h-full rounded-full bg-[var(--accent-amber)]"
              style={{ width: `${getRangePercentage()}%` }}
            />
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{
          scale: region === 'right' ? [1, 1.4, 1] : 1,
          transition: { duration: 0.25 },
        }}
        style={{
          x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0)),
        }}
      >
        {rightIcon}
      </motion.div>
    </motion.div>
  );
};

function decay(value, max) {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}

export default ElasticSlider;
