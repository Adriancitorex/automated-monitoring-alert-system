export interface Multa {
  id: string;
  codigoInfraccion: string;
  placa: string;
  conductor: string;
  dniConductor: string;
  tipoVehiculo: 'Automóvil' | 'Motocicleta' | 'Camión' | 'Bus' | 'Camioneta';
  fecha: string;
  hora: string;
  lugar: string;
  descripcion: string;
  gravedad: 'Leve' | 'Grave' | 'Muy Grave';
  monto: number;
  descuentoProntoPago: number; // Porcentaje ej: 50%
  estado: 'Pendiente' | 'Pagada' | 'En Apelación' | 'Vencida';
  agenteId: string;
  evidenciasFotos?: string[];
  fechaLimitePago: string;
  fechaPago?: string;
  metodoPago?: string;
}

export interface InfraccionCatalogo {
  codigo: string;
  nombre: string;
  gravedad: 'Leve' | 'Grave' | 'Muy Grave';
  montoBase: number;
  puntos: number;
  retencionLicencia: boolean;
}
