import Link from 'next/link';
import { Star, MapPin, Users, BookOpen } from 'lucide-react';

const PLAN_BADGE = {
  max: { label: 'Premium', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  pro: { label: 'Pro', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  basic: { label: null, className: '' },
};

export default function TeacherCard({ teacher }) {
  const badge = PLAN_BADGE[teacher.subscription_plan] || PLAN_BADGE.basic;
  const rating = parseFloat(teacher.avg_rating) || 0;

  return (
    <Link href={`/profesor/${teacher.id}`} className="card block p-5 group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
            {teacher.avatar_url ? (
              <img src={teacher.avatar_url} alt={teacher.teacher_name || teacher.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {(teacher.teacher_name || teacher.name)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {badge.label && (
            <span className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {teacher.teacher_name || teacher.name}
          </h3>
          {teacher.main_announcement && (
            <p className="text-sm text-gray-500 truncate mt-0.5">{teacher.main_announcement}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-gray-700">
                {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
              </span>
              {parseInt(teacher.review_count) > 0 && (
                <span className="text-xs text-gray-400">({teacher.review_count})</span>
              )}
            </div>

            {/* Students */}
            {parseInt(teacher.total_students) > 0 && (
              <div className="flex items-center gap-1 text-gray-400">
                <Users size={13} />
                <span className="text-xs">{teacher.total_students} alumnos</span>
              </div>
            )}

            {/* City */}
            {teacher.city && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin size={13} />
                <span className="text-xs">{teacher.city}</span>
              </div>
            )}
          </div>

          {/* Subjects */}
          {teacher.subjects?.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {teacher.subjects.slice(0, 3).map((s) => (
                <span key={s} className="badge bg-blue-50 text-blue-700 text-xs py-0.5 px-2">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        {teacher.price && (
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-blue-600">${Number(teacher.price).toLocaleString('es-AR')}</div>
            <div className="text-xs text-gray-400">por hora</div>
          </div>
        )}
      </div>
    </Link>
  );
}
