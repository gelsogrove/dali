export default function PageHero({ breadcrumb }) {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero-overlay"></div>
      </section>
      <div className="page-breadcrumbs-wrap">
        <div className="page-breadcrumbs">
          <a href="/">Home</a> <span>{breadcrumb}</span>
        </div>
      </div>
    </>
  );
}
