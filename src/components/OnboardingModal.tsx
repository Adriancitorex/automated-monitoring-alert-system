import React, { useState } from 'react';
import { Shield, CheckCircle2, Car, MessageSquare, CreditCard, X, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
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
        setError('Por favor llena todos los datos requeridos.');
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
      setError('Debes autorizar la consulta de tu vehículo bajo el mandato expreso y aceptar el Aviso de Privacidad.');
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
        throw new Error(data.error || 'Error al completar el registro.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                Jalisco • Asistencia y Monitoreo
              </span>
              <h3 className="text-xl font-black text-white">Autorizar Monitoreo de tu Vehículo</h3>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              step === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-emerald-400'
            }`}>
              1. Datos Vehiculares
            </span>
            <span className="text-slate-600">→</span>
            <span className={`px-2.5 py-1 rounded-full font-bold ${
              step === 2 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              2. Mandato & Plan
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Alejandro Morales"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Teléfono Móvil (WhatsApp para Alertas Inmediatas) *
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+523312345678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enviaremos las alertas de fotomultas y enlaces oficiales directamente a este número.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-amber-600" />
                  Datos Requeridos por el Portal Oficial de Jalisco
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Placa Vehicular *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="JNZ7890"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Últimos 5 Dígitos de Serie (VIN) *
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      required
                      placeholder="48219"
                      value={serie5}
                      onChange={(e) => setSerie5(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nombre o Apodo del Auto (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mi Mazda 3 Rojo / Camioneta Trabajo"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selección de Plan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Elige tu Plan de Monitoreo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPlan('MENSUAL_BASICO')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      plan === 'MENSUAL_BASICO'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-black text-sm">Mensual Básico</div>
                    <div className="text-xl font-black text-amber-400 mt-1">$99 MXN<span className="text-xs font-normal">/mes</span></div>
                    <div className="text-[11px] text-slate-400 mt-2">Sin plazos forzosos. Cancela en cualquier momento.</div>
                  </div>

                  <div
                    onClick={() => setPlan('ANUAL_AHORRO')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                      plan === 'ANUAL_AHORRO'
                        ? 'border-amber-400 bg-slate-900 text-white shadow-md ring-2 ring-amber-400/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                      Ahorra 2 meses
                    </span>
                    <div className="font-black text-sm">Anual con Descuento</div>
                    <div className="text-xl font-black text-amber-400 mt-1">$990 MXN<span className="text-xs font-normal">/año</span></div>
                    <div className="text-[11px] text-slate-400 mt-2">Monitoreo continuo durante todo el año.</div>
                  </div>
                </div>
              </div>

              {/* Mandato Expreso y Términos */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-0.5 rounded-sm text-amber-500 focus:ring-slate-900"
                  />
                  <span className="text-slate-700 leading-snug">
                    <strong>Otorgo mandato expreso</strong> a AvisaMultas Jalisco para que consulte periódicamente en mi nombre los adeudos de mi vehículo en el portal público oficial de la Secretaría de la Hacienda Pública de Jalisco, y acepto el{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowAvisoModal(true);
                      }}
                      className="text-amber-700 font-bold underline hover:text-amber-800"
                    >
                      Aviso de Privacidad y Términos (LFPDPPP)
                    </button>.
                  </span>
                </label>
              </div>

              {/* Simulación de Pasarela segura de pago */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total a pagar hoy:</span>
                  <span className="text-lg font-black text-amber-400">
                    {plan === 'MENSUAL_BASICO' ? '$99.00 MXN' : '$990.00 MXN'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pago simulado en entorno de pruebas (Sandbox Stripe). Activación inmediata.</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 flex justify-between gap-3">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ← Volver a datos
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors ml-auto disabled:opacity-40"
            >
              {cargando ? 'Procesando...' : step === 1 ? 'Continuar a Plan y Pago →' : 'Confirmar y Activar Servicio'}
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
