/**
 * Convert YouTube / Instagram / Vimeo URLs into embeddable src
 * @param {string} url - Video URL
 * @returns {string} - URL embed per iframe
 */
export function getEmbedUrl(url) {
  if (!url) return '';

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';

    if (url.includes('youtube.com/watch')) {
      try {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } catch (e) {
        // Fallback: estrai manualmente se URL non valido
        const match = url.match(/[?&]v=([^&]+)/);
        videoId = match ? match[1] : '';
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0].split('/')[0];
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  // Instagram (Reels o Posts)
  if (url.includes('instagram.com')) {
    // Estrai il path del post/reel
    const match = url.match(/instagram\.com\/(p|reel)\/([^/?]+)/);
    if (match) {
      const type = match[1]; // 'p' o 'reel'
      const mediaId = match[2];
      return `https://www.instagram.com/${type}/${mediaId}/embed/`;
    }
    return url;
  }

  // Vimeo - se è già un player URL, lascialo così
  if (url.includes('vimeo.com')) {
    if (url.includes('player.vimeo.com')) {
      return url; // Già formato embed
    }

    // Converti vimeo.com/123456 in player.vimeo.com/video/123456
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  // Default: ritorna l'URL così com'è
  return url;
}

/**
 * Detect provider type from URL
 * @param {string} url 
 * @returns {'youtube'|'instagram'|'vimeo'|'unknown'}
 */
export function getVideoType(url) {
  if (!url) return 'unknown';

  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('vimeo.com')) return 'vimeo';

  return 'unknown';
}
