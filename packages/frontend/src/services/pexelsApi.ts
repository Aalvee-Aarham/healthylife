// Pexels API Service for HealthyLife Image Fetching
const PEXELS_API_KEY = (import.meta as any).env?.VITE_PEXELS_API_KEY || '';

const FALLBACK_FOOD_IMAGES: Record<string, string> = {
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  chicken: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
  smoothie: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
  steak: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  oats: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'
};

export async function fetchPexelsImage(query: string): Promise<string> {
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    });

    if (!res.ok) throw new Error('Pexels API error');
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium || data.photos[0].src.small;
    }
  } catch (err) {
    console.warn('Pexels API fallback notice:', err);
  }

  // Fallback match
  const q = query.toLowerCase();
  for (const key in FALLBACK_FOOD_IMAGES) {
    if (q.includes(key)) return FALLBACK_FOOD_IMAGES[key];
  }
  return FALLBACK_FOOD_IMAGES.default;
}
