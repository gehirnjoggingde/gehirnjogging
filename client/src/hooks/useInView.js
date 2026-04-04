import { useEffect, useRef, useState } from 'react';

/**
 * Returns [ref, isVisible] – isVisible becomes true once the element
 * enters the viewport (and stays true).
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect(); // fire once
      }
    }, { threshold: 0.15, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
