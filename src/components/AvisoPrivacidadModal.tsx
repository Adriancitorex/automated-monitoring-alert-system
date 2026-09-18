import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface AvisoPrivacidadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvisoPrivacidadModal: React.FC<AvisoPrivacidadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Encabezado */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Aviso de Privacidad y Términos del Servicio</h3>
              <p className="text-[11px] text-slate-400">Cumplimiento LFPDPPP • Mandato Expreso de Consulta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Legal */}
        <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-4 leading-relaxed">
          <section>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              1. Identidad y Responsable del Tratamiento
            </h4>
            <p>
              AvisaMultas Jalisco opera como una plataforma de asistencia y monitoreo vehicular independiente en México. El tratamiento de sus datos personales se apega estrictamente a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              2. Datos Personales Recabados
            </h4>
            <p>Para prestar el servicio, únicamente recabamos:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Datos de contacto:</strong> Nombre completo, correo electrónico y número de teléfono móvil para WhatsApp.</li>
              <li><strong>Datos vehiculares públicos:</strong> Número de placa y últimos 5 dígitos del número de serie (VIN/NIV), tal como constan en la tarjeta de circulación.</li>
            </ul>
            <p className="mt-1">
              No solicitamos ni almacenamos datos personales sensibles, información bancaria directa (procesada de forma cifrada mediante pasarelas certificadas PCI-DSS), ni contraseñas de portales gubernamentales.
            </p>
          </section>

          <section className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            <h4 className="font-bold uppercase text-[11px] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> 3. Mandato Expreso y Autorización de Consulta Pública
            </h4>
            <p>
              Al registrar su vehículo y aceptar este acuerdo, el Usuario otorga un <strong>mandato expreso y comisión mercantil</strong> a AvisaMultas Jalisco para que, en su representación y nombre, acceda periódicamente al portal público de consulta de adeudos de la Secretaría de la Hacienda Pública del Gobierno del Estado de Jalisco, empleando exclusivamente los datos vehiculares provistos (placa y 5 dígitos de serie).
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              4. Modalidad del Servicio y Respeto a los Portales Oficiales
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>El servicio no altera, elimina, condona ni gestiona trámites judiciales o administrativos ante la autoridad.</li>
              <li>AvisaMultas Jalisco no evade controles de seguridad, ni realiza accesos no autorizados a bases de datos restringidas del Gobierno del Estado. La consulta se limita a la información pública desplegada al ingresar placa y serie.</li>
              <li>El servicio actúa como una herramienta informativa y de notificación preventiva vía WhatsApp para facilitar al usuario el conocimiento oportuno de posibles beneficios por pronto pago.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
              5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h4>
            <p>
              El titular podrá ejercer en cualquier momento sus derechos ARCO o revocar el mandato otorgado cancelando su suscripción o solicitando la baja inmediata de sus datos vehiculares de nuestros registros.
            </p>
          </section>
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Entendido y Conforme
          </button>
        </div>

      </div>
    </div>
  );
};
