import CanvasImage from './CanvasImage';
import { stats } from '../data/homeData';

export default function WhyWork() {
  return (
    <section id="why-work">
      <div className="wwwu-container">
        <div className="wwwu-bg">
          <CanvasImage src="/images/wwwu-bg-new.jpg" width={1600} height={535} className="lazyload" />
        </div>
        <div className="wwwu-content">
          <div className="wwwu-title section-title" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
            <strong>Why Work</strong>
            <h2>With Dalila</h2>
          </div>
          <div className="wwwu-numbers" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
            {stats.map((item) => (
              <div className="wwwu-stat" key={item.title}>
                <h3 dangerouslySetInnerHTML={{ __html: item.title }}></h3>
                <p dangerouslySetInnerHTML={{ __html: item.description }}></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
