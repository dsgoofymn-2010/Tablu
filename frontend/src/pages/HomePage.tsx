import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Navigation as NavigationIcon,
  ArrowUpRight,
  MapPin,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Layers,
  Armchair,
  Utensils,
  Star,
  Clock3,
  ArrowUpDown,
} from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  image?: string | null;
  cuisines?: string[];
  area?: string | null;
  cost_for_two?: number | null;
  opens_at?: string | null;
  closes_at?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  floors: number;
  tables: number;
  grid_rows?: number;
  grid_cols?: number;
  distance_km?: number;
}

type SortBy = 'recommended' | 'rating' | 'price' | 'distance';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const toneFor = (id: number) => `tone-${id % 5}`;

const minutesOf = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const istMinutesNow = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return (hour % 24) * 60 + minute;
};

const isOpenNow = (opensAt?: string | null, closesAt?: string | null) => {
  if (!opensAt || !closesAt) return false;
  const cur = istMinutesNow();
  const open = minutesOf(opensAt);
  const close = minutesOf(closesAt);
  return close > open ? cur >= open && cur < close : cur >= open || cur < close;
};

const compactNumber = (n?: number | null) => {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `${n}`;
};

const shortArea = (area?: string | null) => (area ? area.replace(/,\s*Chennai$/i, '') : '');

export const HomePage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [openOnly, setOpenOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locNotice, setLocNotice] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchRestaurants = async (searchQuery: string = query, loc = userLocation) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (loc) {
        params.set('lat', loc.lat.toString());
        params.set('lng', loc.lng.toString());
      }
      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch (err: any) {
      setError(err.message || 'Error loading restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchRestaurants(query, userLocation), 240);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userLocation]);

  useEffect(() => {
    if (!userLocation && sortBy === 'distance') setSortBy('recommended');
  }, [userLocation, sortBy]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const scrollToList = () => {
    document.getElementById('restaurant-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLocateMe = () => {
    if (userLocation) {
      setUserLocation(null);
      setLocNotice(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocNotice('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setLocNotice(`Location access was denied (${err.message}).`);
      },
      { timeout: 8000 }
    );
  };

  const setFallbackChennai = () => {
    setUserLocation({ lat: 13.0827, lng: 80.2707 });
    setLocNotice(null);
  };

  const formatDistance = (km?: number) => {
    if (km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const renderFloorplan = (rows = 4, cols = 4) => {
    const r = Math.min(Math.max(rows, 2), 6);
    const c = Math.min(Math.max(cols, 2), 6);
    const dot = 3;
    const pitch = 6;
    const w = c * pitch;
    const h = r * pitch;
    const dots: React.ReactNode[] = [];
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        dots.push(
          <circle
            key={`${row}-${col}`}
            cx={col * pitch + dot}
            cy={row * pitch + dot}
            r="1.4"
            fill="currentColor"
            opacity={row === 0 && col === 0 ? 0.35 : 0.85}
          />
        );
      }
    }
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {dots}
      </svg>
    );
  };

  const cuisinesOf = (r: Restaurant) =>
    r.cuisines && r.cuisines.length ? r.cuisines : [r.category];

  const cuisineChips = useMemo(() => {
    const counts = new Map<string, number>();
    restaurants.forEach((r) => {
      const unique = new Set(cuisinesOf(r).map((c) => c.toLowerCase()));
      unique.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 9);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants]);

  const featured = useMemo(
    () =>
      [...restaurants].sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.distance_km ?? 0) - (b.distance_km ?? 0)
      )[0] ?? null,
    [restaurants]
  );

  const totalTables = useMemo(
    () => restaurants.reduce((sum, r) => sum + (r.tables ?? 0), 0),
    [restaurants]
  );

  const visibleRestaurants = useMemo(() => {
    const filtered = restaurants.filter((r) => {
      if (categoryFilter !== 'all' && !cuisinesOf(r).some((c) => c.toLowerCase() === categoryFilter)) {
        return false;
      }
      if (openOnly && !isOpenNow(r.opens_at, r.closes_at)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => (a.cost_for_two ?? Infinity) - (b.cost_for_two ?? Infinity));
    } else if (sortBy === 'distance') {
      sorted.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    } else {
      sorted.sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.distance_km ?? 0) - (b.distance_km ?? 0)
      );
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, categoryFilter, openOnly, sortBy]);

  const resetFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setOpenOnly(false);
    setSortBy('recommended');
  };

  return (
    <div>
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-inner hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span className="live-dot" />
              Chennai · live table availability
            </span>

            <h1>
              Your table
              <br />
              is waiting.
            </h1>

            <p className="hero-lede">
              Skip the phone call. See the real floor plan, pick the exact table you want, and lock it in
              before someone else does.
            </p>

            <div className="hero-search">
              <div className="search">
                <Search className="search-icon" size={18} />
                <input
                  type="search"
                  placeholder="Search restaurants by name…"
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') scrollToList();
                  }}
                  aria-label="Search restaurants"
                />
              </div>

              <button
                type="button"
                className={`loc-btn ${userLocation ? 'is-active' : ''}`}
                onClick={handleLocateMe}
                disabled={locating}
                title={userLocation ? 'Clear location sorting' : 'Sort restaurants by distance'}
              >
                <NavigationIcon size={15} className={locating ? 'spin' : ''} />
                <span>{locating ? 'Locating…' : userLocation ? 'Near you' : 'Near me'}</span>
              </button>

              <button type="button" className="btn-primary" onClick={scrollToList}>
                Explore
                <ArrowUpRight size={16} />
              </button>
            </div>

            <ul className="hero-facts">
              <li>
                <CheckCircle2 size={16} /> Real-time seat status
              </li>
              <li>
                <Sparkles size={16} /> Instant confirmation
              </li>
              <li>
                <MapPin size={16} /> Find venues across the city
              </li>
            </ul>
          </div>

          <aside className="hero-showcase" aria-label="Tonight's featured restaurant">
            {featured ? (
              <Link to={`/restaurants/${featured.id}`} className="showcase-card">
                <div className="showcase-media">
                  {featured.image ? (
                    <img src={featured.image} alt={`${featured.name} interior`} loading="eager" />
                  ) : (
                    <div className={`venue-fallback ${toneFor(featured.id)}`} aria-hidden="true">
                      <span className="venue-monogram">{initialsOf(featured.name)}</span>
                    </div>
                  )}
                  {featured.rating !== null && featured.rating !== undefined && (
                    <span className="showcase-rating">
                      <Star size={12} fill="currentColor" /> {featured.rating.toFixed(1)}
                    </span>
                  )}
                  <span
                    className={`venue-open ${isOpenNow(featured.opens_at, featured.closes_at) ? 'is-open' : 'is-closed'}`}
                  >
                    {isOpenNow(featured.opens_at, featured.closes_at) ? 'Open now' : 'Closed'}
                  </span>
                </div>
                <div className="showcase-body">
                  <p className="eyebrow">Tonight’s spotlight</p>
                  <h3>{featured.name}</h3>
                  <p className="showcase-meta">
                    <MapPin size={13} /> {shortArea(featured.area) || 'Chennai'}
                    {featured.cost_for_two ? <span>· ₹{featured.cost_for_two.toLocaleString('en-IN')} for two</span> : null}
                  </p>
                  <span className="showcase-cta">
                    Reserve a table <ArrowUpRight size={15} />
                  </span>
                </div>
              </Link>
            ) : loading ? (
              <div className="showcase-card showcase-skeleton" aria-hidden="true">
                <div className="showcase-media skeleton-media" />
                <div className="showcase-body">
                  <div className="skeleton-bar" style={{ width: '38%' }} />
                  <div className="skeleton-bar big" style={{ width: '72%' }} />
                  <div className="skeleton-bar" style={{ width: '52%' }} />
                </div>
              </div>
            ) : (
              <div className="showcase-card showcase-static">
                <div className="showcase-body">
                  <p className="eyebrow">Why Tablu</p>
                  <h3>See the room before you reserve.</h3>
                  <ul className="showcase-points">
                    <li>
                      <Layers size={15} /> Live floor plans, real tables
                    </li>
                    <li>
                      <Clock3 size={15} /> 5-minute hold while you decide
                    </li>
                    <li>
                      <CheckCircle2 size={15} /> Instant confirmation
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ---------------- restaurant list ---------------- */}
      <main id="restaurant-list" className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Curated dining rooms</p>
            <h2>
              {query ? (
                <>
                  Results for <em style={{ fontStyle: 'italic' }}>“{query}”</em>
                </>
              ) : (
                'Choose your next table'
              )}
            </h2>
            <p className="section-sub">
              {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'} ·{' '}
              {totalTables} tables across Chennai · book in seconds
            </p>
          </div>

          <div className="list-controls">
            <button
              type="button"
              className={`toggle-pill${openOnly ? ' is-active' : ''}`}
              onClick={() => setOpenOnly((v) => !v)}
              aria-pressed={openOnly}
            >
              <Clock3 size={14} />
              Open now
            </button>

            <label className="sort-select">
              <ArrowUpDown size={14} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                aria-label="Sort restaurants"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Top rated</option>
                <option value="price">Price: low to high</option>
                {userLocation && <option value="distance">Nearest first</option>}
              </select>
            </label>
          </div>
        </div>

        {locNotice && (
          <div className="loc-notice" style={{ marginBottom: 20 }}>
            <AlertCircle size={15} />
            <span>{locNotice}</span>
            <button type="button" onClick={setFallbackChennai}>
              Use Chennai downtown
            </button>
          </div>
        )}

        <div className="venue-toolbar">
          <div className="chip-row" role="group" aria-label="Filter by cuisine">
            <button
              type="button"
              className={`chip${categoryFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setCategoryFilter('all')}
              aria-pressed={categoryFilter === 'all'}
            >
              All tables
              <span className="chip-count">{restaurants.length}</span>
            </button>
            {cuisineChips.map(([cat, count]) => (
              <button
                key={cat}
                type="button"
                className={`chip${categoryFilter === cat ? ' is-active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
                aria-pressed={categoryFilter === cat}
              >
                {cat}
                <span className="chip-count">{count}</span>
              </button>
            ))}
          </div>

          {query && (
            <button type="button" className="btn-ghost" onClick={() => setQuery('')}>
              Clear search
            </button>
          )}
        </div>

        {!loading && !error && (
          <p className="result-line">
            Showing <strong>{visibleRestaurants.length}</strong> of {restaurants.length} restaurants
            {categoryFilter !== 'all' && <> · {categoryFilter}</>}
            {openOnly && <> · open now</>}
            {sortBy !== 'recommended' && (
              <>
                {' '}
                · sorted by{' '}
                {sortBy === 'rating' ? 'rating' : sortBy === 'price' ? 'price' : 'distance'}
              </>
            )}
          </p>
        )}

        {loading ? (
          <div className="venue-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="card-skeleton" key={i} aria-hidden="true">
                <div className="skeleton-media" />
                <div className="skeleton-body">
                  <div className="skeleton-bar big" style={{ width: '58%' }} />
                  <div className="skeleton-bar" style={{ width: '38%' }} />
                  <div className="skeleton-bar" style={{ width: '24%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-icon">
              <AlertCircle size={24} />
            </span>
            <h3>We couldn’t load the restaurants</h3>
            <p>{error}</p>
            <button type="button" className="btn-primary" onClick={() => fetchRestaurants()}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : visibleRestaurants.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Utensils size={24} />
            </span>
            <h3>No tables match that combination</h3>
            <p>Try a different cuisine, turn off “Open now”, or clear the filters to see every venue.</p>
            <button type="button" className="btn-primary" onClick={resetFilters}>
              Show all restaurants
            </button>
          </div>
        ) : (
          <div className="venue-grid">
            {visibleRestaurants.map((r, index) => {
              const distText = formatDistance(r.distance_km);
              const open = isOpenNow(r.opens_at, r.closes_at);
              const cuisines = cuisinesOf(r);
              return (
                <Link
                  key={r.id}
                  to={`/restaurants/${r.id}`}
                  className="venue-card"
                  style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
                >
                  <div className="venue-media">
                    {r.image ? (
                      <img src={r.image} alt={`${r.name} interior`} loading="lazy" />
                    ) : (
                      <div className={`venue-fallback ${toneFor(r.id)}`} aria-hidden="true">
                        <span className="venue-monogram">{initialsOf(r.name)}</span>
                      </div>
                    )}

                    {r.rating !== null && r.rating !== undefined && (
                      <span className="venue-rating" title={`${r.rating_count ?? 0} dining ratings`}>
                        <Star size={11} fill="currentColor" /> {r.rating.toFixed(1)}
                        {r.rating_count ? <small>({compactNumber(r.rating_count)})</small> : null}
                      </span>
                    )}

                    {distText && (
                      <span className="venue-dist">
                        <NavigationIcon size={11} /> {distText}
                      </span>
                    )}

                    <span className={`venue-open ${open ? 'is-open' : 'is-closed'}`}>
                      {open ? 'Open now' : 'Closed'}
                    </span>

                    <span className="venue-mini" title="Floor plan preview">
                      {renderFloorplan(r.grid_rows, r.grid_cols)}
                    </span>
                  </div>

                  <div className="venue-body">
                    <p className="venue-cuisine">{cuisines.slice(0, 3).join(' · ')}</p>
                    <h3 className="venue-name">{r.name}</h3>

                    <p className="venue-loc">
                      <MapPin size={13} /> {shortArea(r.area) || 'Chennai'}
                      {distText && (
                        <>
                          <span className="dot">•</span>
                          {distText} away
                        </>
                      )}
                    </p>

                    <p className="venue-meta">
                      <Layers size={13} /> {r.floors} {r.floors === 1 ? 'floor' : 'floors'}
                      <span className="dot">•</span>
                      <Armchair size={13} /> {r.tables} tables
                    </p>

                    <div className="venue-foot">
                      <span className="venue-price">
                        {r.cost_for_two ? (
                          <>
                            ₹{r.cost_for_two.toLocaleString('en-IN')}
                            <small>for two</small>
                          </>
                        ) : (
                          <small>Price on request</small>
                        )}
                      </span>
                      <span className="venue-cta">
                        View tables
                        <span className="venue-arrow">
                          <ArrowUpRight size={15} />
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* ---------------- footer ---------------- */}
      <footer className="site-footer">
        <div className="shell">
          <div className="site-footer-inner">
            <div className="footer-brand">
              <div className="brand" onClick={() => navigate('/')}>
                <span className="brand-mark">
                  <Utensils size={15} />
                </span>
                <span className="brand-word">Tablu</span>
                <span className="brand-city">Chennai</span>
              </div>
              <p>Exact-table reservations for the city’s best dining rooms. No phone calls, no guessing.</p>
            </div>

            <div className="footer-links">
              <div className="footer-col">
                <h4>Explore</h4>
                <Link to="/">Restaurants</Link>
                <Link to="/bookings">My bookings</Link>
              </div>
              <div className="footer-col">
                <h4>Account</h4>
                <Link to="/login">Sign in</Link>
                <Link to="/admin">Admin dashboard</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Tablu · Made for Chennai diners</span>
            <span>Photo: “Basmati Kacchi Biryani” by Nahian · CC BY 4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
