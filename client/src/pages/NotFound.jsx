import { ButtonLink } from '../components/ui/Button';
import { BoomerangMark } from '../components/ui/Logo';
import { useTitle } from '../hooks/useTitle';

export default function NotFound() {
  useTitle('Not found');
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4 text-center">
      <div>
        <BoomerangMark className="mx-auto size-24 animate-float text-grape-fg" />
        <p className="mt-6 font-mono text-sm text-ink-500">404</p>
        <h1 className="mt-1 text-4xl font-extrabold text-ink-50">This page got lost.</h1>
        <p className="mt-2 text-ink-400">Ironic, we know. Nobody has reported finding it yet.</p>
        <ButtonLink to="/" className="mt-6">Back home</ButtonLink>
      </div>
    </div>
  );
}
