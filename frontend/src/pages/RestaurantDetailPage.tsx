import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Timer,
  CalendarDays,
  Users,
  Armchair,
  Sparkles,
  Star,
  MapPin,
  Navigation,
  Share2,
  Copy,
  Phone,
  ArrowRight,
  Info,
  Camera,
  Images,
  Utensils,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Seat {
  id: number;
  floor_id: number;
  label: string;
  row: number;
  col: number;
  capacity: number;
}

interface Floor {
  id: number;
  name: string;
}

interface Review {
  id: number;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
}

interface Photo {
  id: number;
  kind: 'food' | 'ambience';
  label: string;
  path: string;
}

interface RestaurantProfile {
  id: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  image?: string | null;
  cuisines: string[];
  area: string;
  phone: string;
  cost_for_two: number | null;
  opens_at: string;
  closes_at: string;
  rating: number | null;
  rating_count: number | null;
  known_for: string[];
  amenities: string[];
}

interface RestaurantData {
  restaurant: RestaurantProfile;
  floors: Floor[];
  seats: Seat[];
  reviews: Review[];
  photos: Photo[];
}

interface SeatStatusResponse {
  booked: number[];
  held: number[];
}

interface SeatStatusPayload {
  floors?: {
    id: number;
    name: string;
    seats: { id: number; status: 'free' | 'booked' | 'held' }[];
  }[];
}

const SLOTS = ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00'];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'photos', label: 'Photos' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'book', label: 'Book a Table' },
] as const;

const TAB_ICONS = {
  overview: Info,
  photos: Camera,
  reviews: Star,
  book: CalendarDays,
} as const;

type TabId = (typeof TABS)[number]['id'];

type PhotoFilter = 'all' | 'food' | 'ambience';

const toLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const buildDays = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return {
      iso: toLocalISO(d),
      dow: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      day: d.getDate(),
      mon: d.toLocaleDateString(undefined, { month: 'short' }),
    };
  });

const slotLabel = (slot: string) => {
  const [h, m] = slot.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${`${m}`.padStart(2, '0')} ${suffix}`;
};

const compactTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${`${m}`.padStart(2, '0')} ${suffix}`;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

const toneFor = (id: number) => `tone-${id % 5}`;

const friendlyDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

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

const isOpenNow = (opensAt: string, closesAt: string) => {
  if (!opensAt || !closesAt) return false;
  const cur = istMinutesNow();
  const open = minutesOf(opensAt);
  const close = minutesOf(closesAt);
  return close > open ? cur >= open && cur < close : cur >= open || cur < close;
};

const clockLabel = (t: string) => {
  const [hRaw, m] = t.split(':').map(Number);
  const suffix = hRaw >= 12 ? 'pm' : 'am';
  const h = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return m === 0 ? `${h} ${suffix}` : `${h}:${String(m).padStart(2, '0')} ${suffix}`;
};

const relTime = (iso: string) => {
  const then = new Date(iso.replace(' ', 'T')).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(Math.floor((Date.now() - then) / 60000), 1);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso.replace(' ', 'T')).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

const StarRow = ({ n }: { n: number }) => (
  <span className="stars" aria-label={`${n} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Star key={i} size={12} fill={i < n ? 'currentColor' : 'none'} />
    ))}
  </span>
);

export const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(buildDays, []);
  const [date, setDate] = useState(days[0].iso);
  const [slot, setSlot] = useState('19:00');
  const [guests, setGuests] = useState(2);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('all');
  const [copied, setCopied] = useState<'link' | 'address' | null>(null);
  const tabsRef = useRef<HTMLElement | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [seatStatuses, setSeatStatuses] = useState<SeatStatusResponse>({ booked: [], held: [] });
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [timerText, setTimerText] = useState<string>('');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        if (!res.ok) throw new Error('Restaurant not found');
        const data: RestaurantData = await res.json();
        setRestaurantData(data);
        if (data.floors.length > 0) {
          setActiveFloorId(data.floors[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [id]);

  const loadSeatStatuses = async () => {
    if (!id || !date || !slot) return;
    try {
      const res = await fetch(`/api/restaurants/${id}/seats?date=${date}&slot=${slot}`);
      if (res.ok) {
        const data: SeatStatusPayload = await res.json();
        const booked: number[] = [];
        const held: number[] = [];
        (data.floors ?? []).forEach((floor) => {
          floor.seats.forEach((seat) => {
            if (seat.status === 'booked') booked.push(seat.id);
            if (seat.status === 'held') held.push(seat.id);
          });
        });
        setSeatStatuses({ booked, held });
      }
    } catch {
      // ignore network hiccups — the map simply keeps its last state
    }
  };

  const stopHoldTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setHoldExpiresAt(null);
    setTimerText('');
  };

  useEffect(() => {
    loadSeatStatuses();
    setSelectedSeatIds([]);
    stopHoldTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date, slot]);

  useEffect(() => {
    if (!holdExpiresAt) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const tick = () => {
      const diff = Math.ceil((holdExpiresAt - Date.now()) / 1000);
      if (diff <= 0) {
        stopHoldTimer();
        setSelectedSeatIds([]);
        loadSeatStatuses();
        setNotice({ type: 'error', text: 'Your seat hold expired. Please select tables again.' });
      } else {
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setTimerText(`${m}:${s < 10 ? '0' + s : s}`);
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdExpiresAt]);

  const syncHoldWithServer = async (seatIds: number[]) => {
    if (!user) return;
    try {
      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: seatIds, date, slot }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.expires_at) {
          setHoldExpiresAt(Date.parse(data.expires_at));
        } else {
          stopHoldTimer();
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSeatClick = (seat: Seat) => {
    const isBooked = seatStatuses.booked?.includes(seat.id);
    const isHeld = seatStatuses.held?.includes(seat.id);
    if (isBooked || isHeld) return;

    setNotice(null);
    let next: number[];
    if (selectedSeatIds.includes(seat.id)) {
      next = selectedSeatIds.filter((sId) => sId !== seat.id);
    } else {
      next = [...selectedSeatIds, seat.id];
    }
    setSelectedSeatIds(next);
    syncHoldWithServer(next);
  };

  const handleBook = async () => {
    if (selectedSeatIds.length === 0) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/restaurants/${id}`)}`);
      return;
    }

    setBookingInProgress(true);
    setNotice(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seats: selectedSeatIds,
          date,
          slot,
        }),
      });

      if (res.status === 401) {
        navigate(`/login?next=${encodeURIComponent(`/restaurants/${id}`)}`);
        return;
      }

      if (res.status === 409) {
        const errData = await res.json().catch(() => ({}));
        await loadSeatStatuses();
        setNotice({
          type: 'error',
          text:
            errData.error === 'seat held by someone else'
              ? 'Another diner is currently holding those tables. The map has refreshed.'
              : 'Those tables were just booked by someone else. The map has refreshed.',
        });
        return;
      }

      if (!res.ok) {
        throw new Error('Could not complete booking.');
      }

      stopHoldTimer();
      navigate('/bookings');
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Booking failed. Try again.' });
    } finally {
      setBookingInProgress(false);
    }
  };

  const jumpToTab = (tab: TabId) => {
    setActiveTab(tab);
    requestAnimationFrame(() =>
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  const submitReview = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/restaurants/${id}`)}`);
      return;
    }
    if (reviewBody.trim().length < 10) {
      setReviewError('Tell us a little more — at least 10 characters.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(false);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: Number(id),
          rating: reviewRating,
          body: reviewBody.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        navigate(`/login?next=${encodeURIComponent(`/restaurants/${id}`)}`);
        return;
      }
      if (!res.ok) {
        setReviewError(data.error || 'Could not post your review.');
        return;
      }
      setRestaurantData((prev) =>
        prev ? { ...prev, reviews: [data.review, ...prev.reviews] } : prev
      );
      setReviewBody('');
      setReviewRating(5);
      setReviewSuccess(true);
    } catch {
      setReviewError('Network error — please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const copyText = async (text: string, which: 'link' | 'address') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  if (loading) {
    return (
      <div className="canvas booking-page">
        <div className="skeleton-bar" style={{ width: 120, height: 14 }} />
        <div className="skeleton-bar" style={{ width: '42%', height: 46, marginTop: 22 }} />
        <div className="panel" style={{ height: 260, marginTop: 32 }} />
      </div>
    );
  }

  if (error || !restaurantData) {
    return (
      <div className="canvas booking-page">
        <div className="empty-state">
          <span className="empty-icon">
            <ShieldAlert size={24} />
          </span>
          <h3>We couldn’t open this restaurant</h3>
          <p>{error || 'Restaurant not found.'}</p>
          <Link to="/" className="btn-primary">
            <ChevronLeft size={15} /> Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  const { restaurant, floors, seats, reviews, photos } = restaurantData;
  const currentFloor = floors.find((f) => f.id === activeFloorId);
  const floorSeats = seats.filter((s) => s.floor_id === activeFloorId);

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalCapacity = selectedSeats.reduce((acc, s) => acc + s.capacity, 0);

  const maxCol = floorSeats.length > 0 ? Math.max(...floorSeats.map((s) => s.col)) : 5;
  const gridCols = Math.max(maxCol, 4);

  const open = isOpenNow(restaurant.opens_at, restaurant.closes_at);
  const hoursLabel =
    restaurant.opens_at && restaurant.closes_at
      ? `${compactTime(restaurant.opens_at)} – ${compactTime(restaurant.closes_at)}`
      : '';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
  const telHref = restaurant.phone ? `tel:${restaurant.phone.replace(/\s+/g, '')}` : '';
  const filteredPhotos = photos.filter((p) => photoFilter === 'all' || p.kind === photoFilter);
  const heroPhoto = photos[0];

  return (
    <div className="canvas booking-page">
      <Link to="/" className="back-link">
        <ChevronLeft size={15} /> All restaurants
      </Link>

      <section className="venue-hero" aria-label={`${restaurant.name} overview`}>
        <div className="venue-hero-copy">
          <p className="eyebrow">
            {(restaurant.cuisines.length ? restaurant.cuisines : [restaurant.category]).join(' · ')}
          </p>

          <div className="venue-title-row">
            <h1>{restaurant.name}</h1>
            {restaurant.rating !== null && (
              <div className="rating-block">
                <span className="rating-chip">
                  <Star size={12} fill="currentColor" /> {restaurant.rating.toFixed(1)}
                </span>
                <div className="rating-meta">
                  <strong>{(restaurant.rating_count ?? 0).toLocaleString('en-IN')}</strong>
                  <span>Dining ratings</span>
                </div>
              </div>
            )}
          </div>

          {restaurant.area && (
            <p className="venue-area">
              <MapPin size={13} /> {restaurant.area}
            </p>
          )}

          <div className="venue-facts">
            {hoursLabel && (
              <span className={`status-pill${open ? ' is-open' : ' is-closed'}`}>
                {open
                  ? `Open · closes ${clockLabel(restaurant.closes_at!)}`
                  : `Closed · opens ${clockLabel(restaurant.opens_at!)}`}
              </span>
            )}
            {restaurant.phone && (
              <a className="venue-fact venue-phone" href={telHref}>
                <Phone size={13} /> {restaurant.phone}
              </a>
            )}
          </div>

          <div className="action-pills">
            <a className="action-pill" href={mapsUrl} target="_blank" rel="noreferrer">
              <Navigation size={14} /> Direction
            </a>
            <button
              type="button"
              className="action-pill"
              onClick={() => copyText(window.location.href, 'link')}
            >
              <Share2 size={14} /> Share
            </button>
            <button type="button" className="action-pill" onClick={() => jumpToTab('reviews')}>
              <Star size={14} /> Reviews
            </button>
            <button type="button" className="action-pill is-primary" onClick={() => jumpToTab('book')}>
              <CalendarDays size={14} /> Book a table
            </button>
            {copied && (
              <span className="copied-chip">{copied === 'link' ? 'Link copied' : 'Address copied'}</span>
            )}
          </div>
        </div>

        <div className="venue-hero-media">
          <button type="button" className="venue-cover" onClick={() => jumpToTab('photos')}>
            {heroPhoto ? (
              <img src={heroPhoto.path} alt={heroPhoto.label} className="venue-cover-img" />
            ) : (
              <span className={`cover-fallback ${toneFor(restaurant.id)}`} aria-hidden="true">
                <span className="cover-monogram">{initialsOf(restaurant.name)}</span>
                <span className="cover-cuisine">
                  {restaurant.cuisines[0] || restaurant.category} · Chennai
                </span>
              </span>
            )}
            <span className="cover-shade" aria-hidden="true" />
            <span className="cover-label">{heroPhoto?.label ?? `An evening at ${restaurant.name}`}</span>
            <span className="cover-cta">
              <Images size={13} /> View gallery
            </span>
          </button>

          <div className="venue-thumbs">
            {photos.slice(1, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                className="venue-thumb"
                onClick={() => jumpToTab('photos')}
              >
                <img src={p.path} alt={p.label} loading="lazy" />
                <span className="tile-label">{p.label}</span>
              </button>
            ))}
            {Array.from({ length: Math.max(0, 2 - photos.slice(1, 3).length) }).map((_, i) => (
              <span
                key={`thumb-fallback-${i}`}
                className={`venue-thumb-fallback tone-${(restaurant.id + i + 1) % 5}`}
                aria-hidden="true"
              >
                <span className="thumb-glyph">
                  {i === 0 ? <Utensils size={22} /> : <Sparkles size={22} />}
                </span>
                <span className="thumb-caption">{i === 0 ? 'Dining room' : 'Chef’s table'}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="venue-quickfacts">
        {restaurant.rating !== null && (
          <div className="quickfact">
            <span className="quickfact-icon">
              <Star size={16} />
            </span>
            <div className="quickfact-text">
              <strong>{restaurant.rating.toFixed(1)}</strong>
              <span>{(restaurant.rating_count ?? 0).toLocaleString('en-IN')} ratings</span>
            </div>
          </div>
        )}
        {restaurant.cost_for_two && (
          <div className="quickfact">
            <span className="quickfact-icon">
              <Utensils size={16} />
            </span>
            <div className="quickfact-text">
              <strong>₹{restaurant.cost_for_two.toLocaleString('en-IN')}</strong>
              <span>for two, approx.</span>
            </div>
          </div>
        )}
        {hoursLabel && (
          <div className="quickfact">
            <span className="quickfact-icon">
              <Clock size={16} />
            </span>
            <div className="quickfact-text">
              <strong>{hoursLabel}</strong>
              <span>{open ? 'Open now' : 'Closed right now'}</span>
            </div>
          </div>
        )}
        <div className="quickfact">
          <span className="quickfact-icon">
            <Armchair size={16} />
          </span>
          <div className="quickfact-text">
            <strong>{seats.length} tables</strong>
            <span>
              across {floors.length} {floors.length === 1 ? 'floor' : 'floors'}
            </span>
          </div>
        </div>
      </div>

      <nav className="detail-tabs" role="tablist" aria-label="Restaurant sections" ref={tabsRef}>
        {TABS.map((t) => {
          const TabIcon = TAB_ICONS[t.id];
          const count = t.id === 'photos' ? photos.length : t.id === 'reviews' ? reviews.length : null;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`detail-tab${activeTab === t.id ? ' is-active' : ''}`}
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            >
              <TabIcon size={15} />
              {t.label}
              {count !== null && <span className="detail-tab-count">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`detail-layout${activeTab === 'book' ? ' is-book' : ''}`}>
        <main className="detail-main">
          {activeTab === 'overview' && (
            <div className="detail-pane">
              {restaurant.known_for.length > 0 && (
                <section className="info-card">
                  <h3>Known for</h3>
                  <p className="info-sub">What regulars order again and again</p>
                  <div className="chip-row">
                    {restaurant.known_for.map((k) => (
                      <span key={k} className="soft-chip is-accent">
                        {k}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="info-card">
                <h3>Average cost</h3>
                <p className="cost-line">
                  {restaurant.cost_for_two
                    ? `₹${restaurant.cost_for_two.toLocaleString('en-IN')} for two people (approx.)`
                    : 'Cost details coming soon'}
                </p>
                <p className="info-fine">Exclusive of applicable taxes and charges, if any</p>
                <p className="info-fine">Cash and cards accepted · Digital payments accepted</p>
              </section>

              {restaurant.cuisines.length > 0 && (
                <section className="info-card">
                  <h3>Cuisines</h3>
                  <div className="chip-row">
                    {restaurant.cuisines.map((c) => (
                      <span key={c} className="soft-chip">
                        {c}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {restaurant.amenities.length > 0 && (
                <section className="info-card">
                  <h3>More info</h3>
                  <div className="amenity-grid">
                    {restaurant.amenities.map((a) => (
                      <span key={a} className="amenity-item">
                        <CheckCircle2 size={15} /> {a}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="info-card">
                <h3>Good to know</h3>
                <div className="amenity-grid">
                  <span className="amenity-item">
                    <Armchair size={15} /> {seats.length} tables across {floors.length}{' '}
                    {floors.length === 1 ? 'floor' : 'floors'}
                  </span>
                  <span className="amenity-item">
                    <Clock size={15} /> {hoursLabel || 'Hours coming soon'}
                  </span>
                  <span className="amenity-item">
                    <Users size={15} /> Tables seat 2–6 guests
                  </span>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="detail-pane">
              <div className="photo-filters" role="tablist" aria-label="Photo filters">
                {(['all', 'food', 'ambience'] as const).map((f) => {
                  const count = f === 'all' ? photos.length : photos.filter((p) => p.kind === f).length;
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`photo-chip${photoFilter === f ? ' is-active' : ''}`}
                      onClick={() => setPhotoFilter(f)}
                      aria-pressed={photoFilter === f}
                    >
                      {f === 'all' ? 'All' : f === 'food' ? 'Food' : 'Ambience'} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="photo-grid">
                {filteredPhotos.map((p) => (
                  <figure key={p.id} className="photo-tile">
                    <img src={p.path} alt={p.label} loading="lazy" className="gallery-img" />
                    <figcaption className="tile-label">{p.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="detail-pane">
              <section className="info-card review-form-card">
                <h3>Write a review</h3>
                <p className="info-sub">
                  {user
                    ? 'Share how your visit went — only guests who booked a table here can post.'
                    : 'Sign in after you dine to share your experience.'}
                </p>

                <div className="review-stars" role="radiogroup" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={reviewRating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className={`star-pick${n <= reviewRating ? ' is-on' : ''}`}
                      onClick={() => setReviewRating(n)}
                    >
                      <Star size={22} fill={n <= reviewRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>

                <textarea
                  className="review-input"
                  rows={4}
                  maxLength={1000}
                  placeholder="What did you order? How was the service?"
                  value={reviewBody}
                  onChange={(e) => {
                    setReviewBody(e.target.value);
                    setReviewError(null);
                    setReviewSuccess(false);
                  }}
                />

                {reviewError && (
                  <div className="notice is-error" role="alert">
                    <AlertTriangle size={16} />
                    <span>{reviewError}</span>
                  </div>
                )}
                {reviewSuccess && (
                  <div className="notice is-success" role="status">
                    <CheckCircle2 size={16} />
                    <span>Thanks — your review is live.</span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary"
                  disabled={reviewSubmitting}
                  onClick={submitReview}
                >
                  {reviewSubmitting ? 'Posting…' : user ? 'Post review' : 'Sign in to review'}
                  {!reviewSubmitting && <Star size={15} />}
                </button>
              </section>

              {reviews.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Star size={24} />
                  </span>
                  <h3>No reviews yet</h3>
                  <p>Be the first to share how your visit went after you dine here.</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <article key={r.id} className="review-card">
                    <div className="review-head">
                      <div className="review-user">
                        <span className="avatar">{r.author_name.charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{r.author_name}</strong>
                          <div className="review-sub">
                            <StarRow n={r.rating} />
                            <span className="review-time">{relTime(r.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="dining-tag">Dining</span>
                    </div>
                    <p className="review-body">{r.body}</p>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === 'book' && (
            <div className="detail-pane">
              <div className="book-head">
                <span className="live-badge">Live availability</span>
              </div>

              <section className="booking-steps" aria-label="Choose date and time">
                <div className="step">
                  <span className="step-n">1</span>
                  <div className="step-body">
                    <span className="step-label">Choose a date</span>
                    <div className="day-strip">
                      {days.map((d) => (
                        <button
                          key={d.iso}
                          type="button"
                          className={`day-chip${date === d.iso ? ' is-active' : ''}`}
                          onClick={() => setDate(d.iso)}
                          aria-pressed={date === d.iso}
                        >
                          <span className="dow">{d.dow}</span>
                          <span className="dnum">{d.day}</span>
                          <span className="dmon">{d.mon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="step">
                  <span className="step-n">2</span>
                  <div className="step-body">
                    <span className="step-label">Choose a time</span>
                    <div className="slot-strip">
                      {SLOTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`slot-chip${slot === s ? ' is-active' : ''}`}
                          onClick={() => setSlot(s)}
                          aria-pressed={slot === s}
                        >
                          {slotLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {notice && (
                <div
                  className={`notice ${notice.type === 'error' ? 'is-error' : 'is-success'}`}
                  style={{ marginBottom: 20 }}
                >
                  {notice.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{notice.text}</span>
                </div>
              )}

              <div className="booking-layout">
                <section className="panel seat-panel" aria-label="Table availability">
                  <div className="panel-head">
                    <div className="legend">
                      <span className="legend-item">
                        <span className="swatch seat free" /> Available
                      </span>
                      <span className="legend-item">
                        <span className="swatch seat selected" /> Selected
                      </span>
                      <span className="legend-item">
                        <span className="swatch seat booked" /> Booked
                      </span>
                      <span className="legend-item">
                        <span className="swatch seat held" /> On hold
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {timerText && (
                        <span className="hold-timer">
                          <Timer size={12} /> {timerText}
                        </span>
                      )}
                      <span className="count">
                        {selectedSeatIds.length} {selectedSeatIds.length === 1 ? 'table' : 'tables'} selected
                      </span>
                    </div>
                  </div>

                  <div className="floor-tabs" role="tablist" aria-label="Floors">
                    {floors.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="tab"
                        className="floor-tab"
                        aria-selected={activeFloorId === f.id}
                        onClick={() => {
                          setActiveFloorId(f.id);
                          setNotice(null);
                        }}
                      >
                        {f.name} floor
                      </button>
                    ))}
                  </div>

                  {floorSeats.length === 0 ? (
                    <div className="seat-grid-empty">
                      <strong>Nothing on this floor yet</strong>
                      No tables have been set up for {currentFloor?.name || 'this floor'}.
                    </div>
                  ) : (
                    <div
                      className="seat-grid"
                      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                    >
                      {floorSeats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const isBooked = seatStatuses.booked?.includes(seat.id);
                        const isHeld = seatStatuses.held?.includes(seat.id);

                        let statusClass = 'free';
                        if (isSelected) statusClass = 'selected';
                        else if (isBooked) statusClass = 'booked';
                        else if (isHeld) statusClass = 'held';

                        const isDisabled = isBooked || isHeld;

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            className={`seat ${statusClass}`}
                            style={{ gridRow: seat.row, gridColumn: seat.col }}
                            disabled={isDisabled}
                            onClick={() => handleSeatClick(seat)}
                            aria-pressed={isSelected}
                            title={`Table ${seat.label} · ${seat.capacity} seats · ${statusClass}`}
                          >
                            <span className="seat-label">{seat.label}</span>
                            <span className="seat-cap">{seat.capacity} seats</span>
                            <span className="seat-pips" aria-hidden="true">
                              {Array.from({ length: Math.min(seat.capacity, 6) }).map((_, i) => (
                                <i key={i} />
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <aside className="summary" aria-label="Reservation summary">
                  <div className="summary-head">
                    <p className="eyebrow">Step 3</p>
                    <h2>Your reservation</h2>
                    <p>
                      {restaurant.name} · {currentFloor?.name || 'Ground'} floor
                    </p>
                  </div>

                  <div className="summary-body">
                    <div className="summary-row">
                      <span>Date</span>
                      <strong>{friendlyDate(date)}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Time</span>
                      <strong>{slotLabel(slot)}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Tables</span>
                      {selectedSeats.length ? (
                        <span className="summary-tables">
                          {selectedSeats.map((s) => (
                            <span className="table-pill" key={s.id}>
                              {s.label}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <strong style={{ color: 'var(--muted-2)', fontWeight: 600 }}>—</strong>
                      )}
                    </div>

                    {selectedSeats.length ? (
                      <>
                        <div className="summary-total">
                          <span>Party size</span>
                          <strong>
                            {totalCapacity} <small>{totalCapacity === 1 ? 'guest' : 'guests'}</small>
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="btn-primary"
                          disabled={bookingInProgress}
                          onClick={handleBook}
                        >
                          {bookingInProgress ? 'Reserving…' : user ? 'Confirm reservation' : 'Sign in to reserve'}
                          {!bookingInProgress && <Sparkles size={15} />}
                        </button>

                        <p className="summary-note">
                          Your table is held for a few minutes while you finish. Cancel free from My bookings.
                        </p>
                      </>
                    ) : (
                      <div className="summary-empty">
                        <CalendarDays size={22} />
                        <div>Pick a table on the floor plan to see your party size and confirm the booking.</div>
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              <p className="summary-note" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 22 }}>
                <Users size={13} /> Tables are sized for 2–6 guests. Larger group? Combine two adjacent tables.
              </p>
            </div>
          )}
        </main>

        {activeTab !== 'book' && (
          <aside className="detail-rail" aria-label="Quick reservation">
            <div className="rail-card">
              <p className="eyebrow">Table reservation</p>
              <h2>Reserve your table</h2>

              <div className="rail-field">
                <span>Date</span>
                <div className="chip-row" role="radiogroup" aria-label="Date">
                  {days.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      role="radio"
                      aria-checked={date === d.iso}
                      className={`pick-chip${date === d.iso ? ' is-active' : ''}`}
                      onClick={() => setDate(d.iso)}
                    >
                      {d.dow === 'Today' ? 'Today' : friendlyDate(d.iso)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rail-field">
                <span>Time</span>
                <div className="chip-row" role="radiogroup" aria-label="Time">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={slot === s}
                      className={`pick-chip${slot === s ? ' is-active' : ''}`}
                      onClick={() => setSlot(s)}
                    >
                      {slotLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rail-field">
                <span>Guests</span>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    aria-label="Fewer guests"
                    disabled={guests <= 1}
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  >
                    −
                  </button>
                  <span className="stepper-value" aria-live="polite">
                    {guests} <small>{guests === 1 ? 'guest' : 'guests'}</small>
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    aria-label="More guests"
                    disabled={guests >= 10}
                    onClick={() => setGuests((g) => Math.min(10, g + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <button type="button" className="btn-primary" onClick={() => jumpToTab('book')}>
                Find a table <ArrowRight size={15} />
              </button>
              <p className="rail-note">
                You’ll pick your exact tables on the live floor plan — sized {guests}{' '}
                {guests === 1 ? 'guest' : 'guests'} or more.
              </p>
            </div>

            <div className="rail-card">
              <h3>Direction</h3>
              <p className="rail-address">
                <MapPin size={14} /> {restaurant.area || 'Chennai'}
              </p>
              <div className="rail-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => copyText(restaurant.area || restaurant.name, 'address')}
                >
                  <Copy size={14} /> Copy
                </button>
                <a className="btn-ghost" href={mapsUrl} target="_blank" rel="noreferrer">
                  <Navigation size={14} /> Direction
                </a>
              </div>
              {restaurant.phone && (
                <a className="rail-phone" href={telHref}>
                  <Phone size={13} /> {restaurant.phone}
                </a>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
