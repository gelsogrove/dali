# Frontend Integration Guide

## API Home Endpoint

### Endpoint
```
GET http://localhost:8080/api/home
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "featured_properties": [
      {
        "id": "1",
        "title": "Luxury Waterfront Villa",
        "slug": "luxury-waterfront-villa",
        "description": "Stunning waterfront property...",
        "price": "2500000.00",
        "bedrooms": "5",
        "bathrooms": "4.5",
        "square_feet": "4800",
        "property_type": "Single Family",
        "address": "123 Ocean Drive",
        "city": "Miami Beach",
        "state": "FL",
        "featured_image": null,
        "main_image": {
          "id": "1",
          "image_url": "/uploads/properties/large/image.jpg",
          "thumbnail_url": "/uploads/properties/thumbnail/image.jpg",
          "caption": "Main view"
        }
      }
    ],
    "featured_videos": [
      {
        "id": "1",
        "property_id": "1",
        "title": "Luxury Villa Tour",
        "description": "Complete walkthrough...",
        "video_url": "https://player.vimeo.com/video/1042515673",
        "video_type": "vimeo",
        "thumbnail_url": "/uploads/videos/thumbnails/villa-tour.jpg",
        "display_order": "1",
        "property": {
          "id": "1",
          "title": "Luxury Waterfront Villa",
          "slug": "luxury-waterfront-villa",
          "price": "2500000.00",
          "city": "Miami Beach"
        }
      }
    ]
  }
}
```

## React Integration Examples

### 1. Home Page - Featured Properties & Videos

```jsx
// fe/src/pages/Home.jsx
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080/api';

function Home() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/home`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHomeData(data.data);
        } else {
          setError(data.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Featured Properties Section */}
      <section className="featured-properties">
        <h2>Featured Properties</h2>
        <div className="properties-grid">
          {homeData?.featured_properties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Featured Videos Section */}
      <section className="featured-videos">
        <h2>Property Tours</h2>
        <div className="videos-grid">
          {homeData?.featured_videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
```

### 2. Video Card Component with Vimeo Popup

```jsx
// fe/src/components/VideoCard.jsx
import { useState } from 'react';

function VideoCard({ video }) {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {/* Video Thumbnail */}
      <div className="video-card" onClick={handleClick}>
        <div className="video-thumbnail">
          <img 
            src={video.thumbnail_url || '/images/video-placeholder.jpg'} 
            alt={video.title}
          />
          <div className="play-button">▶</div>
        </div>
        <div className="video-info">
          <h3>{video.title}</h3>
          <p>{video.description}</p>
          {video.property && (
            <div className="property-tag">
              <span>{video.property.title}</span>
              <span>${Number(video.property.price).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Vimeo Popup */}
      {showPopup && (
        <div className="video-popup" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>×</button>
            <iframe
              src={video.video_url}
              width="100%"
              height="500"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}

export default VideoCard;
```

### 3. CSS for Video Popup

```css
/* fe/src/styles/VideoPopup.css */
.video-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  border-radius: 8px;
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.video-card:hover .play-button {
  background: #fff;
  transform: translate(-50%, -50%) scale(1.1);
}

/* Popup Styles */
.video-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-content {
  position: relative;
  width: 90%;
  max-width: 1200px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: transparent;
  border: none;
  color: white;
  font-size: 40px;
  cursor: pointer;
  z-index: 10000;
  line-height: 1;
  padding: 0;
  width: 40px;
  height: 40px;
}

.close-btn:hover {
  opacity: 0.7;
}

.popup-content iframe {
  display: block;
}
```

### 4. Property Card Component

```jsx
// fe/src/components/PropertyCard.jsx
import { Link } from 'react-router-dom';

function PropertyCard({ property }) {
  const imageUrl = property.main_image?.image_url || 
                   property.featured_image || 
                   '/images/property-placeholder.jpg';

  return (
    <Link to={`/properties/${property.slug}`} className="property-card">
      <div className="property-image">
        <img src={imageUrl} alt={property.title} />
        <div className="property-price">
          ${Number(property.price).toLocaleString()}
        </div>
      </div>
      <div className="property-details">
        <h3>{property.title}</h3>
        <p className="property-location">
          📍 {property.city}, {property.state}
        </p>
        <div className="property-features">
          <span>🛏️ {property.bedrooms} beds</span>
          <span>🛁 {property.bathrooms} baths</span>
          <span>📏 {Number(property.square_feet).toLocaleString()} sqft</span>
        </div>
        <p className="property-description">
          {property.description?.substring(0, 100)}...
        </p>
      </div>
    </Link>
  );
}

export default PropertyCard;
```

### 5. Environment Variables

Create `fe/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

Then use in code:

```jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

## Video Table Structure

The `videos` table supports:

- **video_url**: Vimeo embed URL (e.g., `https://player.vimeo.com/video/1042515673`)
- **video_type**: `vimeo`, `youtube`, or `upload`
- **thumbnail_url**: Preview image path
- **is_featured**: Show on homepage
- **display_order**: Sort order
- **property_id**: Link to property (optional)

## Adding Videos via Admin Panel

### Option 1: Link to Property
```javascript
{
  property_id: 1,
  title: "Villa Tour",
  video_url: "https://player.vimeo.com/video/1042515673",
  video_type: "vimeo",
  thumbnail_url: "/uploads/videos/thumbnails/villa.jpg",
  is_featured: 1,
  display_order: 1
}
```

### Option 2: Standalone Video
```javascript
{
  property_id: null,  // No property link
  title: "Neighborhood Tour",
  video_url: "https://player.vimeo.com/video/1042515674",
  video_type: "vimeo",
  thumbnail_url: "/uploads/videos/thumbnails/neighborhood.jpg",
  is_featured: 1,
  display_order: 2
}
```

## Testing

```bash
# Get homepage data
curl http://localhost:8080/api/home | jq .

# Get only videos
curl http://localhost:8080/api/home/videos | jq .

# Get all properties
curl http://localhost:8080/api/properties | jq .
```

## Notes

- Videos are **NOT uploaded files** - they're Vimeo/YouTube links
- Thumbnail images ARE uploaded (via admin panel)
- Click thumbnail → opens popup with Vimeo embed
- Featured videos appear on homepage automatically
- Non-featured videos appear only on property detail pages
