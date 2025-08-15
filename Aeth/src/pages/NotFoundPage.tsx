import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="text-center space-y-4 py-12 sm:py-20">
      <h1 className="heading text-3xl sm:text-4xl">404</h1>
      <p className="text-text-secondary text-sm sm:text-base">La ruta que buscas no existe.</p>
      <p className="text-xs text-text-secondary">Sugerencia: usa el Navbar para navegar o vuelve al inicio.</p>
      <Link to="/">
        <Button variant="surface" className="w-full sm:w-auto">Volver al inicio</Button>
      </Link>
    </div>
  );
}


