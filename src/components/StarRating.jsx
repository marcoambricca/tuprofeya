'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 24 }) {
  const [hover, setHover] = useState(0);

  if (readonly) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={(hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}
          />
        </button>
      ))}
    </div>
  );
}
