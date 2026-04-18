import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReviewCard({ review }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
          {review.student_avatar ? (
            <img src={review.student_avatar} alt={review.student_name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">{review.student_name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">{review.student_name}</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <div className="flex gap-0.5 my-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={14} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
            ))}
          </div>
          {review.teacher_name && (
            <p className="text-xs text-blue-600 mb-1">Clases con {review.teacher_name}</p>
          )}
          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
