import React, { useState } from 'react';
import { ShieldCheck, Car, Lock, Plus } from 'lucide-react';
import { UserPortalView } from './components/UserPortalView';
import { AdminPanelView } from './components/AdminPanelView';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>('portal');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [ultimaPlacaRegistrada, setUltimaPlacaRegistrada] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] antialiased">
      {/* Top Header Institucional */}
      <header className="bg-white border-b border-[#E2E5E8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-9 h-9 rounded-md bg-[#0F2A4A] flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#111827] leading-none">
                  AvisaMultas Jalisco
                </h1>
                <span className="text-[11px] font-semibold bg-[#EEF2F6] text-[#4B5563] px-2 py-0.5 rounded border border-[#D5DCE4]">
                  Servicio Independiente
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] mt-0.5 hidden sm:block">
                Consulta vehicular bajo mandato expreso y alertas por WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Selector de Vista: Portal Conductor vs Panel Admin Privado */}
            <nav aria-label="Cambio de vista" className="bg-[#EEF2F6] p-1 rounded-md flex items-center gap-1 text-xs font-semibold border border-[#E2E5E8]">
              <button
                type="button"
                onClick={() => setCurrentView('portal')}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  currentView === 'portal'
                    ? 'bg-white text-[#0F2A4A] shadow-xs font-bold border border-[#E2E5E8]'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Car className="w-3.5 h-3.5" strokeWidth={1.8} /> Portal Conductor
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-[#0F2A4A] text-white font-bold'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={1.8} /> Panel Admin
              </button>
            </nav>

            {currentView === 'portal' && (
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0F2A4A] hover:bg-[#163B66] rounded transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={2} /> Registrar Vehículo
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
        {currentView === 'portal' ? (
          <UserPortalView onOpenRegister={() => setIsOnboardingOpen(true)} />
        ) : (
          <AdminPanelView />
        )}
      </main>

      {/* Footer Sobrio */}
      <footer className="bg-white border-t border-[#E2E5E8] mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left text-xs text-[#4B5563] space-y-1.5">
          <p className="font-bold text-[#111827]">
            AvisaMultas Jalisco • Servicio de Monitoreo Preventivo Vehicular
          </p>
          <p className="text-[11px] text-[#6B7280] max-w-2xl leading-relaxed">
            Las consultas se realizan en el portal público de adeudos vehiculares de la Secretaría de la Hacienda Pública del Estado de Jalisco bajo el mandato expreso y consentimiento otorgado por cada titular registral. En estricto apego a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
        </div>
      </footer>

      {/* Modal de Onboarding */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={(placa) => {
          setUltimaPlacaRegistrada(placa);
          alert(`Vehículo con placa ${placa} registrado correctamente en el sistema.`);
        }}
      />
    </div>
  );
}
