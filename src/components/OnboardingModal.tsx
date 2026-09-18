import React, { useState } from 'react';
import { ShieldCheck, Check, Car, MessageSquare, CreditCard, X, ArrowRight } from 'lucide-react';
import { AvisoPrivacidadModal } from './AvisoPrivacidadModal';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (placa: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('+52');
  const [placa, setPlaca] = useState('');
  const [serie5, setSerie5] = useState('');
  const [alias, setAlias] = useState('');
  const [plan, setPlan] = useState<'MENSUAL_BASICO' | 'ANUAL_AHORRO'>('MENSUAL_BASICO');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [showAvisoModal, setShowAvisoModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!nombre.trim() || !email.trim() || !telefono.trim() || !placa.trim() || !serie5.trim()) {
        setError('Todos los campos marcados con asterisco son obligatorios.');
        return;
      }
      if (serie5.trim().length !== 5) {
        setError('El número de serie debe contener exactamente los últimos 5 dígitos requeridos por el portal oficial de Jalisco.');
        return;
      }
      setStep(2);
      return;
    }

    if (!aceptaTerminos) {
      setError('Es indispensable otorgar el mandato expreso y aceptar los términos legales para proceder.');
      return;
    }

    // Paso 2: Confirmación y activación de suscripción
    setCargando(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email,
          telefonoWhatsApp: telefono,
          placa,
          numeroSerie5: serie5,
          alias,
          plan
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al completar el registro del vehículo.');
      }

      onSuccess(placa.toUpperCase().trim());
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2A4A]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-[#E2E5E8] w-full max-w-xl overflow-hidden shadow-lg text-left">
        {/* Encabezado Institucional */}
        <div className="bg-[#0F2A4A] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute right-4 top-4 p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300">
                Secretaría de la Hacienda Pública • Jalisco
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                Registro de Vehículo y Mandato de Monitoreo
              </h3>
            </div>
          </div>

          {/* Stepper Sobrio */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
            <span className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
              step === 1 ? 'bg-white text-[#0F2A4A]' : 'bg-white/20 text-white'
            }`}>
              1. Datos Vehiculares
            </span>
            <span className="text-slate-400">→</span>
            <span className={`px-2 py-0.5 rounded font-semibold ${
              step === 2 ? 'bg-white text-[#0F2A4A]' : 'bg-white/10 text-slate-300'
            }`}>
              2. Mandato y Plan
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Nombre Completo del Titular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Alejandro Morales"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full text-xs border border-[#D5DCE4] rounded p-2 focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A] bg-[#F8F9FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-[#D5DCE4] rounded p-2 focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A] bg-[#F8F9FA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Número Telefónico (WhatsApp para Alertas) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+523312345678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#D5DCE4] rounded focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A] bg-[#F8F9FA]"
                  />
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  A este número se enviarán los folios oficiales detectados y las fechas de vencimiento de pronto pago.
                </p>
              </div>

              {/* Datos requeridos por SHP Jalisco */}
              <div className="p-4 bg-[#F8F9FA] border border-[#E2E5E8] rounded-md space-y-3">
                <div className="text-xs font-bold text-[#111827]">
                  Campos Requeridos por el Portal Oficial de Jalisco
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                      Placa Vehicular *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="JNZ7890"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold uppercase border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                      Últimos 5 Dígitos Serie (VIN) *
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      required
                      placeholder="48219"
                      value={serie5}
                      onChange={(e) => setSerie5(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                    Identificador o Alias del Auto (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mazda 3 / Vehículo de Oficina"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full text-xs border border-[#D5DCE4] rounded p-2 bg-white focus:outline-hidden focus:border-[#0F2A4A] focus:ring-1 focus:ring-[#0F2A4A]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selección de Plan */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#111827]">
                  Modalidad de Monitoreo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPlan('MENSUAL_BASICO')}
                    className={`p-3.5 rounded border cursor-pointer transition-colors ${
                      plan === 'MENSUAL_BASICO'
                        ? 'border-[#0F2A4A] bg-[#F0F4F8] text-[#0F2A4A]'
                        : 'border-[#E2E5E8] bg-white text-[#4B5563] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="font-bold text-xs">Mensual Continuo</div>
                    <div className="text-lg font-bold text-[#111827] mt-1 font-mono">$99 MXN<span className="text-xs font-normal text-[#6B7280]">/mes</span></div>
                    <div className="text-[11px] text-[#6B7280] mt-1">Sin plazos forzosos. Cancelación libre.</div>
                  </div>

                  <div
                    onClick={() => setPlan('ANUAL_AHORRO')}
                    className={`p-3.5 rounded border cursor-pointer transition-colors relative ${
                      plan === 'ANUAL_AHORRO'
                        ? 'border-[#0F2A4A] bg-[#F0F4F8] text-[#0F2A4A]'
                        : 'border-[#E2E5E8] bg-white text-[#4B5563] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-[#0F2A4A] text-white text-[10px] font-semibold px-2 py-0.2 rounded">
                      2 meses bonificados
                    </span>
                    <div className="font-bold text-xs">Anual Preventivo</div>
                    <div className="text-lg font-bold text-[#111827] mt-1 font-mono">$990 MXN<span className="text-xs font-normal text-[#6B7280]">/año</span></div>
                    <div className="text-[11px] text-[#6B7280] mt-1">Cobertura ininterrumpida 12 meses.</div>
                  </div>
                </div>
              </div>

              {/* Mandato Expreso Formal */}
              <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E8] rounded text-xs space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-0.5 rounded border-[#D5DCE4] text-[#0F2A4A] focus:ring-[#0F2A4A]"
                  />
                  <span className="text-[#374151] leading-relaxed">
                    <strong>Otorgo mandato expreso</strong> a AvisaMultas Jalisco para que consulte periódicamente en mi nombre los registros públicos de mi placa en la Secretaría de la Hacienda Pública de Jalisco, y acepto el{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowAvisoModal(true);
                      }}
                      className="text-[#0F2A4A] font-bold underline hover:text-[#163B66]"
                    >
                      Aviso de Privacidad (LFPDPPP)
                    </button>.
                  </span>
                </label>
              </div>

              {/* Detalle de Pago */}
              <div className="p-3.5 bg-[#F8F9FA] border border-[#E2E5E8] rounded flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Importe de Activación</span>
                  <span className="text-base font-bold text-[#111827] font-mono">
                    {plan === 'MENSUAL_BASICO' ? '$99.00 MXN' : '$990.00 MXN'}
                  </span>
                </div>
                <div className="text-right text-[11px] text-[#6B7280]">
                  Entorno de pruebas activo<br />
                  Activación inmediata
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[#E2E5E8] flex items-center justify-between gap-3">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] rounded transition-colors"
              >
                ← Regresar a datos
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#111827] rounded transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2A4A] hover:bg-[#163B66] rounded transition-colors ml-auto disabled:opacity-50"
            >
              {cargando 
                ? 'Procesando registro...' 
                : step === 1 
                  ? 'Continuar al Mandato →' 
                  : 'Confirmar y Activar Monitoreo'}
            </button>
          </div>
        </form>

        <AvisoPrivacidadModal
          isOpen={showAvisoModal}
          onClose={() => setShowAvisoModal(false)}
        />
      </div>
    </div>
  );
};

