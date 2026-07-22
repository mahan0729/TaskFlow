import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  text: string;
  children: ReactNode;
  /** Preferred position — flips automatically if it would clip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ text, children, position = 'top', delay = 400 }: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords]   = useState({ top: 0, left: 0 });
  const ref    = useRef<HTMLSpanElement>(null);
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  function show() {
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const gap = 8;
      let top = 0, left = 0;

      if (position === 'top')    { top = r.top - gap;       left = r.left + r.width / 2; }
      if (position === 'bottom') { top = r.bottom + gap;    left = r.left + r.width / 2; }
      if (position === 'left')   { top = r.top + r.height / 2; left = r.left - gap; }
      if (position === 'right')  { top = r.top + r.height / 2; left = r.right + gap; }

      setCoords({ top, left });
      setVisible(true);
    }, delay);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const posClass: Record<string, string> = {
    top:    '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left:   '-translate-x-full -translate-y-1/2',
    right:  '-translate-y-1/2',
  };

  const arrowClass: Record<string, string> = {
    top:    'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-[-4px]  left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left:   'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right:  'left-[-4px]  top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>

      {visible && createPortal(
        <div
          ref={tipRef}
          role="tooltip"
          style={{ top: coords.top, left: coords.left, position: 'fixed', zIndex: 9999 }}
          className={`pointer-events-none px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium shadow-lg whitespace-nowrap max-w-xs ${posClass[position]}`}
        >
          {text}
          <span className={`absolute w-0 h-0 border-4 border-gray-900 ${arrowClass[position]}`} />
        </div>,
        document.body
      )}
    </>
  );
}
