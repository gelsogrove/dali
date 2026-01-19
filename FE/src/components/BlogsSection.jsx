import { Splide, SplideSlide } from '@splidejs/react-splide';
import CanvasImage from './CanvasImage';
import { blogs } from '../data/homeData';

export default function BlogsSection() {
  return (
    <section id="blogs">
      <div className="blogs-container">
        <div className="blogs-bg">
          <CanvasImage src="/images/blogs-bg-new.jpg" width={1600} height={900} className="lazyload" />
        </div>
        <div className="blogs-content">
          <div className="blogs-title section-title" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
            <strong>Featured</strong>
            <h2>Blogs</h2>
          </div>
          <div className="blogs-grid-div">
            <Splide
              aria-label="Featured blogs"
              options={{
                type: 'loop',
                perPage: 3,
                gap: '25px',
                arrows: false,
                pagination: false,
                autoplay: true,
                interval: 5000,
                pauseOnHover: true,
                breakpoints: {
                  1100: { perPage: 2 },
                  768: { perPage: 1 },
                },
              }}
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="300"
            >
              {blogs.map((blog) => (
                <SplideSlide key={blog.href} className="blog-item">
                  <div className="blog-image">
                    <a href={blog.href} target="_blank" rel="noopener noreferrer" aria-label={blog.title}>
                      <CanvasImage src={blog.image} width={360} height={269} className="lazyload" />
                    </a>
                  </div>
                  <div className="blog-item-content">
                    <div className="blog-item-title">
                      <a href={blog.href} target="_blank" rel="noopener noreferrer">
                        <strong>{blog.title}</strong>
                      </a>
                    </div>
                    <div className="blog-item-date">{blog.date}</div>
                    <div className="blog-item-description">
                      <p>{blog.excerpt}</p>
                    </div>
                    <div className="blog-link">
                      <a href={blog.href} target="_blank" rel="noopener noreferrer" className="default-button">
                        Learn More <span className="screen-reader-text">About {blog.title}</span>
                      </a>
                    </div>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
          <a href="/category/blog/" className="default-button">
            View More Blogs
          </a>
        </div>
      </div>
    </section>
  );
}
