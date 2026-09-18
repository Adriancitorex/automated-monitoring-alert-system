import React, { useState } from 'react';
import { Shield, Car, Lock, MessageSquare, Plus } from 'lucide-react';
import { UserPortalView } from './components/UserPortalView';
import { AdminPanelView } from './components/AdminPanelView';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>('portal');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [ultimaPlacaRegistrada, setUltimaPlacaRegistrada] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-2">
                AvisaMultas Jalisco
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                  Asistencia Vial
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Monitoreo con mandato y alertas oportunas por WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Selector de Vista: Portal Ciudadano vs Panel Admin Privado */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setCurrentView('portal')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentView === 'portal'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" /> Portal Conductor
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Panel Admin
              </button>
            </div>

            {currentView === 'portal' && (
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Registrar Auto
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'portal' ? (
          <UserPortalView onOpenRegister={() => setIsOnboardingOpen(true)} />
        ) : (
          <AdminPanelView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-2">
          <p className="font-bold text-slate-700">
            AvisaMultas Jalisco • Plataforma Independiente de Monitoreo Vehicular
          </p>
          <p className="text-[11px] text-slate-400 max-w-xl mx-auto">
            Servicio prestado bajo mandato expreso del titular registral. Las consultas se realizan en el portal público de la Secretaría de la Hacienda Pública de Jalisco con apego a la LFPDPPP y a los términos oficiales.
          </p>
        </div>
      </footer>

      {/* Modal de Onboarding */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={(placa) => {
          setUltimaPlacaRegistrada(placa);
          alert(`¡Vehículo con placa ${placa} registrado exitosamente! La suscripción está activa.`);
        }}
      />
    </div>
  );
}
