import { useSearchParams } from 'react-router-dom';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import PageHero from '../components/PageHero';
import SEO from '../components/SEO';
import OffMarketGate from '../components/OffMarketGate';

export default function OffMarketPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <OffMarketGate token={token}>
      <SEO
        title="Off-Market Properties for Sale"
        description="Browse exclusive off-market luxury properties in Riviera Maya. Private listings not available on the public market."
        noindex={true}
      />
      <PageHero breadcrumb="» Off-Market Properties" />
      <FeaturedProperties
        activeTab="off"
        paginate
        pageSize={12}
        showTitle={true}
        disableAnimations={true}
        titleKicker="Private"
        titleText="Off-Market"
        token={token}
      />
      <ContactWithCta />
    </OffMarketGate>
  );
}

