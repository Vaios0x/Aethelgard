import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { useEffect, useState } from 'react';
import { useToast } from '../../lib/notifications';
import { SiweMessage } from 'siwe';
import { getNonce, loginSiwe, setToken, getToken, clearToken } from '../../lib/api';
import { coreTestnet2, ensureChain } from '../../lib/wagmi';
import { isMockMode } from '../../lib/utils';

export default function ConnectWalletButton() {
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));
  const [isLoading, setIsLoading] = useState(false);
  const { show } = useToast();
  const { openConnectModal } = useConnectModal();
  const [pendingSiweAfterConnect, setPendingSiweAfterConnect] = useState(false);
  const backendEnabled = Boolean(import.meta.env.VITE_BACKEND_URL);

  useEffect(() => {
    const onStorage = () => setAuthed(Boolean(getToken()));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Autenticación manual: no auto-lanzamos SIWE; solo se dispara al hacer clic en "Entrar".

  async function handleSiwe() {
    try {
      if (!address) { show('Conecta tu wallet primero', 'error'); return; }
      // Garantiza que la red Core esté disponible en la wallet
      await ensureChain({ ...coreTestnet2 });
      setIsLoading(true);
      let nonce: string;
      try {
        nonce = await getNonce(address);
      } catch (e: any) {
        if (e?.message === 'backend-offline') {
          show('Backend no disponible. Habilita Demo Mode para explorar.', 'error');
        }
        throw e;
      }
      const domain = window.location.hostname; // evita incluir puerto
      const message = new SiweMessage({
        domain,
        address,
        // sin statement para evitar líneas extra y cumplir max 6 líneas
        uri: window.location.origin,
        version: '1',
        chainId: Number(chain?.id ?? coreTestnet2.id),
        nonce,
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const { accessToken } = await loginSiwe(message, signature);
      setToken(accessToken);
      setAuthed(true);
      show('Sesión iniciada', 'success');
    } catch (e: any) {
      console.error(e);
      if (e?.message === 'backend-offline') {
        if (isMockMode()) {
          // Autenticación simulada en Demo Mode
          setToken('DEMO_TOKEN');
          setAuthed(true);
          show('Sesión simulada iniciada (Demo Mode)', 'success');
        } else {
          show('No se pudo conectar al backend. Revisa VITE_BACKEND_URL o usa Demo Mode.', 'error');
        }
      } else {
        show(e?.message ?? 'No se pudo iniciar sesión', 'error');
      }
    } finally {
      setIsLoading(false);
      setPendingSiweAfterConnect(false);
    }
  }

  // Un solo botón: si no está conectada la wallet, primero abre el modal de conexión
  // y, al conectarse, lanza SIWE automáticamente (solo en este flujo)
  async function handleEntrarClick() {
    if (!address) {
      setPendingSiweAfterConnect(true);
      openConnectModal?.();
      return;
    }
    await handleSiwe();
  }

  // Cuando el usuario termine de conectar la wallet desde el modal, si el flujo está pendiente, dispara SIWE
  useEffect(() => {
    if (address && pendingSiweAfterConnect && !authed && !isLoading) {
      void handleSiwe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, pendingSiweAfterConnect]);

  return (
    <div className="flex items-center gap-2">
      <ConnectButton chainStatus="icon" showBalance={false} />
      {backendEnabled && address && !authed && (
        <button
          className="btn-ghost px-3 py-2 rounded-md"
          onClick={handleEntrarClick}
          disabled={isLoading}
          aria-label="Iniciar sesión con SIWE"
          title="Iniciar sesión con SIWE"
        >
          {isLoading ? 'Entrando…' : 'Entrar'}
        </button>
      )}
      {!backendEnabled && (
        <span
          className="px-2 py-1 text-xs rounded-md bg-neutral-700/50 border border-neutral-600/60 text-neutral-300"
          aria-live="polite"
          title="Configura VITE_BACKEND_URL para habilitar login"
        >Login desactivado</span>
      )}
      {authed && (
        <>
          <span className="px-2 py-1 text-xs rounded-md bg-emerald-600/20 border border-emerald-400/40 text-emerald-200"
            aria-live="polite"
          >Sesión activa</span>
          <button
            className="btn-ghost px-3 py-2 rounded-md"
            onClick={() => { clearToken(); setAuthed(false); }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >Salir</button>
        </>
      )}
    </div>
  );
}


