import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface AvisoPrivacidadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvisoPrivacidadModal: React.FC<AvisoPrivacidadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#0F2A4A]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-[#E2E5E8] w-full max-w-2xl overflow-hidden shadow-lg flex flex-col max-h-[85vh] text-left">
        
        {/* Encabezado */}
        <div className="bg-[#0F2A4A] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white/10 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Aviso de Privacidad y Términos del Servicio</h3>
              <p className="text-[11px] text-slate-300">Cumplimiento LFPDPPP • Mandato Expreso de Monitoreo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Legal */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs text-[#374151] space-y-4 leading-relaxed">
          <section>
            <h4 className="font-bold text-[#111827] text-xs mb-1">
              1. Identidad y Responsable del Tratamiento
            </h4>
            <p>
              AvisaMultas Jalisco opera como una plataforma de asistencia y monitoreo vehicular independiente en México. El tratamiento de sus datos personales se apega estrictamente a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#111827] text-xs mb-1">
              2. Datos Personales Recabados
            </h4>
            <p>Para prestar el servicio de monitoreo, recabamos exclusivamente:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Datos de contacto:</strong> Nombre completo, correo electrónico y número de teléfono móvil para WhatsApp.</li>
              <li><strong>Datos vehiculares públicos:</strong> Número de placa y últimos 5 dígitos del número de serie (VIN/NIV), tal como constan en la tarjeta de circulación.</li>
            </ul>
            <p className="mt-1">
              No solicitamos ni almacenamos datos personales sensibles, información bancaria directa (procesada de forma cifrada mediante pasarelas certificadas PCI-DSS), ni contraseñas de portales gubernamentales.
            </p>
          </section>

          <section className="p-3.5 bg-[#F0F4F8] rounded border border-[#D5DCE4] text-[#0F2A4A]">
            <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 shrink-0" /> 3. Mandato Expreso y Autorización de Consulta Pública
            </h4>
            <p className="text-xs leading-relaxed text-[#163B66]">
              Al registrar su vehículo y confirmar el servicio, el Usuario otorga un <strong>mandato expreso y comisión mercantil</strong> a AvisaMultas Jalisco para que, en su representación y nombre, acceda periódicamente al portal público de consulta de adeudos de la Secretaría de la Hacienda Pública del Gobierno del Estado de Jalisco, empleando exclusivamente los datos vehiculares provistos (placa y 5 dígitos de serie).
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#111827] text-xs mb-1">
              4. Modalidad del Servicio y Respeto a los Portales Oficiales
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>El servicio no altera, elimina, condona ni gestiona trámites judiciales o administrativos ante la autoridad recaudadora.</li>
              <li>AvisaMultas Jalisco no evade controles de seguridad, ni realiza accesos no autorizados a bases de datos restringidas del Gobierno del Estado. La consulta se limita a la información pública desplegada al ingresar placa y serie.</li>
              <li>El servicio actúa como una herramienta informativa y de notificación preventiva vía WhatsApp para facilitar al usuario el conocimiento oportuno de posibles beneficios por pronto pago.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-[#111827] text-xs mb-1">
              5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
            </h4>
            <p>
              El titular podrá ejercer en cualquier momento sus derechos ARCO o revocar el mandato otorgado cancelando su suscripción o solicitando la baja inmediata de sus datos vehiculares de nuestros registros.
            </p>
          </section>
        </div>

        {/* Pie */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E2E5E8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2A4A] hover:bg-[#163B66] rounded transition-colors"
          >
            Entendido y Conforme
          </button>
        </div>

      </div>
    </div>
  );
};

