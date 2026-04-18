'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import TeacherCard from '../../components/TeacherCard';
import { announcements as announcementsApi } from '../../lib/api';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const LEVELS = [
  { value: '', label: 'Todos los niveles' },
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'universitario', label: 'Universitario' },
  { value: 'adultos', label: 'Adultos' },
];

const MODALITIES = [
  { value: '', label: 'Cualquier modalidad' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'presencial', label: 'Presencial' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    level: '',
    modality: '',
  });

  const doSearch = async (q = query, f = filters) => {
    setLoading(true);
    try {
      const params = { q: q || undefined, ...f };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const { data } = await announcementsApi.search(params);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doSearch(searchParams.get('q') || '', filters);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch();
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    doSearch(query, newFilters);
  };

  const clearFilters = () => {
    const empty = { minPrice: '', maxPrice: '', level: '', modality: '' };
    setFilters(empty);
    doSearch(query, empty);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Search header */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="¿Qué materia buscás?"
                className="input-field pl-12 text-lg"
              />
            </div>
            <button type="submit" className="btn-primary">Buscar</button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all ${showFilters || hasFilters ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <SlidersHorizontal size={18} />
              Filtros {hasFilters && <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{Object.values(filters).filter(Boolean).length}</span>}
            </button>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio mínimo ($/h)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  className="input-field w-36"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio máximo ($/h)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="Sin límite"
                  className="input-field w-36"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel educativo</label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="input-field w-48"
                >
                  {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                <select
                  value={filters.modality}
                  onChange={(e) => handleFilterChange('modality', e.target.value)}
                  className="input-field w-44"
                >
                  {MODALITIES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium pb-3">
                  <X size={16} /> Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {loading ? 'Buscando...' : (
              results.length > 0
                ? `${results.length} profe${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}${query ? ` para "${query}"` : ''}`
                : query ? `No se encontraron resultados para "${query}"` : 'Todos los profesores'
            )}
          </h2>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {results.map((t) => (
              <TeacherCard key={t.id} teacher={{ ...t, id: t.profile_id, teacher_name: t.teacher_name }} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No encontramos resultados</h3>
            <p className="text-gray-500 mb-6">Probá con otra materia o eliminá los filtros</p>
            <button onClick={() => { setQuery(''); clearFilters(); }} className="btn-primary">
              Ver todos los profesores
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><Navbar /></div>}>
      <SearchContent />
    </Suspense>
  );
}
