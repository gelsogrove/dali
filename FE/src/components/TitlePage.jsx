import TitleHeader from './TitleHeader';
import './TitlePage.css';

export default function TitlePage({ kicker, title, className = '', aos = true }) {
  return <TitleHeader kicker={kicker} title={title} className={className} aos={aos} align="center" />;
}
