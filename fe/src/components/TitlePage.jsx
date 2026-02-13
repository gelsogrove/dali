import TitleHeader from './TitleHeader';
import './TitlePage.css';

export default function TitlePage({ kicker, title, subtitle, className = '', aos = true }) {
  return <TitleHeader kicker={kicker} title={title} subtitle={subtitle} className={className} aos={aos} align="center" />;
}
