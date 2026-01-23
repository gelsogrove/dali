import { useState, useEffect } from 'react';
import './PropertiesPage.css';
import PageHero from '../components/PageHero';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import { api } from '../config/api';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await api.get('/properties');
        if (response.success) {
          setProperties(response.data.properties || []);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <>
      <PageHero breadcrumb="» Properties" />
      {loading ? (
        <div style={{ padding: '100px 5%', textAlign: 'center' }}>
          <p>Loading properties...</p>
        </div>
      ) : (
        <FeaturedProperties activeTab="active" paginate pageSize={12} items={properties} />
      )}
      <ContactWithCta />
    </>
  );
}
