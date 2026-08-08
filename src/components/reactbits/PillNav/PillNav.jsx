import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

/**
 * PillNav — squarish pill nav with a sweeping circle hover effect.
 * Adapted from reactbits "Pill Nav", themed with project CSS tokens.
 */

export default function PillNav({
  logo,
  logoAlt = 'Logo',
  items = [],
  activeHref,
  logoHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = 'var(--bg-elevated)',
  pillColor = 'var(--bg-primary)',
  hoveredPillTextColor = 'var(--text-primary)',
  pillTextColor = 'var(--text-secondary)',
  onMobileMenuClick,
  initialLoadAnimation = false
}) {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const activeTweenRefs = useRef([]);
  const logoSpinRef = useRef(null);
  const logoTweenRef = useRef(null);
  const hamburgerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navItemsRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1, y: 0 });
    }

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;

      if (logoEl) {
        gsap.set(logoEl, { scale: 0 });
        gsap.to(logoEl, { scale: 1, duration: 0.6, ease });
      }

      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, { width: 'auto', duration: 0.6, ease });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const el = logoSpinRef.current;
    if (!el) return;
    logoTweenRef.current?.kill();
    gsap.set(el, { rotate: 0 });
    logoTweenRef.current = gsap.to(el, { rotate: 360, duration: 0.2, ease, overwrite: 'auto' });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: 'top center' }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: 'top center',
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    onMobileMenuClick?.();
  };

  const isExternalLink = (href) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href) => href && !isExternalLink(href);

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor,
    ['--nav-h']: '44px',
    ['--pill-pad-x']: '16px',
    ['--pill-gap']: '3px'
  };

  return (
    <div className="relative z-[var(--z-dropdown)] w-auto">
      <nav
        className={`flex w-auto items-center justify-between md:justify-start ${className}`}
        aria-label="Primary"
        style={cssVars}
      >
        {isRouterLink(logoHref) ? (
          <Link
            to={logoHref}
            aria-label={logoAlt}
            onMouseEnter={handleLogoEnter}
            ref={logoRef}
            className="inline-flex items-center justify-center overflow-hidden rounded-[var(--radius-sm)]"
            style={{ width: 'var(--nav-h)', height: 'var(--nav-h)', background: 'var(--base, #000)' }}
          >
            <span ref={logoSpinRef} className="block size-full" style={{ willChange: 'transform' }}>
              {logo}
            </span>
          </Link>
        ) : (
          <a
            href={logoHref || '#'}
            aria-label={logoAlt}
            onMouseEnter={handleLogoEnter}
            ref={logoRef}
            className="inline-flex items-center justify-center overflow-hidden rounded-[var(--radius-sm)]"
            style={{ width: 'var(--nav-h)', height: 'var(--nav-h)', background: 'var(--base, #000)' }}
          >
            <span ref={logoSpinRef} className="block size-full" style={{ willChange: 'transform' }}>
              {logo}
            </span>
          </a>
        )}

        <div
          ref={navItemsRef}
          className="relative ml-2 hidden items-center rounded-[var(--radius-sm)] md:flex"
          style={{ height: 'var(--nav-h)', background: 'var(--base, #000)' }}
        >
          <ul
            role="menubar"
            className="flex h-full list-none items-stretch p-[3px] m-0"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;

              const pillStyle = {
                background: 'var(--pill-bg, #fff)',
                color: 'var(--pill-text, var(--base, #000))',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)'
              };

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute bottom-0 left-1/2 z-[1] block rounded-full pointer-events-none"
                    style={{ background: 'var(--base, #000)', willChange: 'transform' }}
                    aria-hidden="true"
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack relative z-[2] inline-block leading-[1]">
                    <span
                      className="pill-label relative z-[2] inline-block font-heading text-[13px] font-semibold uppercase leading-[1] tracking-[0.1em]"
                      style={{ willChange: 'transform' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-[3] inline-block font-heading text-[13px] font-semibold uppercase leading-[1] tracking-[0.1em]"
                      style={{ color: 'var(--hover-text, #fff)', willChange: 'transform, opacity' }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                </>
              );

              const basePillClasses =
                'relative inline-flex h-full items-center justify-center overflow-hidden rounded-[var(--radius-sm)] px-0 whitespace-nowrap no-underline box-border font-semibold cursor-pointer';

              return (
                <li key={item.href} role="none" className="relative flex h-full">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </a>
                  )}
                  {isActive && (
                    <span
                      className="absolute -bottom-[5px] left-1/2 z-[4] size-2 -translate-x-1/2 rounded-full"
                      style={{ background: 'var(--accent-amber, #f5a524)' }}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="relative ml-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border-0 p-0 md:hidden"
          style={{ width: 'var(--nav-h)', height: 'var(--nav-h)', background: 'var(--base, #000)' }}
        >
          <span
            className="hamburger-line h-0.5 w-4 rounded origin-center"
            style={{ background: 'var(--pill-text, #fff)' }}
          />
          <span
            className="hamburger-line h-0.5 w-4 rounded origin-center"
            style={{ background: 'var(--pill-text, #fff)' }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        ref={mobileMenuRef}
        className="absolute left-0 right-0 top-full z-[var(--z-dropdown)] mt-2 min-w-[220px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] origin-top"
        style={{ ...cssVars, background: 'var(--base, #f0f0f0)' }}
      >
        <ul className="m-0 flex list-none flex-col gap-[3px] p-[3px]">
          {items.map((item) => {
            const defaultStyle = {
              background: 'var(--pill-bg, #fff)',
              color: 'var(--pill-text, #fff)'
            };
            const hoverIn = (e) => {
              e.currentTarget.style.background = 'var(--base)';
              e.currentTarget.style.color = 'var(--hover-text, #fff)';
            };
            const hoverOut = (e) => {
              e.currentTarget.style.background = 'var(--pill-bg, #fff)';
              e.currentTarget.style.color = 'var(--pill-text, #fff)';
            };

            const linkClasses =
              'block rounded-[var(--radius-sm)] px-4 py-3 font-heading text-base font-semibold uppercase tracking-[0.08em] transition-colors duration-200';

            return (
              <li key={item.href}>
                {isRouterLink(item.href) ? (
                  <Link
                    to={item.href}
                    className={linkClasses}
                    style={defaultStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className={linkClasses}
                    style={defaultStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
