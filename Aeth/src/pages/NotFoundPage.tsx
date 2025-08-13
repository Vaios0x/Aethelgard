import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="text-center space-y-4 py-20">
      <h1 className="heading text-4xl">404</h1>
      <p className="text-text-secondary">La ruta que buscas no existe.</p>
      <Link to="/">
        <Button variant="surface">Volver al inicio</Button>
      </Link>
    </div>
  );
}


