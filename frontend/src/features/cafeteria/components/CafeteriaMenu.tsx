import { useState, useRef } from 'react';
import { cafeteriaVenues } from '../data/venues';
import { formatPrice } from '../utils/format';

export function CafeteriaMenu() {
  const [activeVenueId, setActiveVenueId] = useState(cafeteriaVenues[0].id);
  const cafeteriaViewRef = useRef<HTMLElement>(null);
  const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const activeVenueIndex = cafeteriaVenues.findIndex(venue => venue.id === activeVenueId);
  const activeVenue = cafeteriaVenues[activeVenueIndex] ?? cafeteriaVenues[0];

  const showVenue = (nextIndex: number) => {
    const maxIndex = cafeteriaVenues.length - 1;
    const safeIndex = Math.min(Math.max(nextIndex, 0), maxIndex);
    const nextVenueId = cafeteriaVenues[safeIndex].id;

    if (nextVenueId === activeVenueId) {
      return;
    }

    setActiveVenueId(nextVenueId);
    requestAnimationFrame(() => {
      cafeteriaViewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    swipeStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!swipeStart.current || swipeStart.current.pointerId !== event.pointerId) {
      return;
    }

    const diffX = event.clientX - swipeStart.current.x;
    const diffY = event.clientY - swipeStart.current.y;
    swipeStart.current = null;

    if (Math.abs(diffX) < 56 || Math.abs(diffX) < Math.abs(diffY) * 1.25) {
      return;
    }

    showVenue(activeVenueIndex + (diffX < 0 ? 1 : -1));
  };

  return (
    <section
      ref={cafeteriaViewRef}
      className="cafeteria-view"
      aria-label="学食メニュー"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      <header className="cafeteria-header">
        <div>
          <p className="section-kicker">Cafeteria</p>
          <h1>学食メニュー</h1>
        </div>
      </header>

      <div className="venue-tabs" role="tablist" aria-label="学食の場所">
        {cafeteriaVenues.map(venue => {
          const isActive = venue.id === activeVenueId;

          return (
            <button
              key={venue.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`venue-button${isActive ? ' is-active' : ''}`}
              onClick={() => showVenue(cafeteriaVenues.findIndex(item => item.id === venue.id))}
            >
              {venue.name}
            </button>
          );
        })}
      </div>

      <div className="venue-summary">
        <p>{activeVenue.detail}</p>
      </div>

      <div className="menu-grid" aria-live="polite">
        {activeVenue.items.map(item => (
          <article className="menu-card" key={`${activeVenue.id}-${item.name}`}>
            <span className="menu-category">{item.category}</span>
            <h2>{item.name}</h2>
            <p className="menu-price">
              {formatPrice(item.price)}
              <span>（税込）</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
