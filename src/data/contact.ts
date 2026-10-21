export interface ContactConfig {
  title: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  officeHours: string;
  mapUrl: string;
  mapCoordinates: {
    lat: number;
    lng: number;
  };
  social: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  form: {
    labels: {
      name: string;
      lastName: string;
      docNumber: string;
      email: string;
      phone: string;
      preference: string;
      schedule: string;
      terms: string;
      auth: string;
    }
  }
}

export const contactConfig: ContactConfig = {
  title: "Livigno 555",
  description: "Desarrollado por Inmobiliaria Santa Cruz en Av. de los Patriotas 555, San Miguel.",
  address: "Av. de los Patriotas 555\nSan Miguel, Lima",
  phone: "",
  email: "",
  officeHours: "",
  mapUrl: "https://www.google.com/maps?q=-12.075601,-77.10136",
  mapCoordinates: {
    lat: -12.075601,
    lng: -77.10136
  },
  social: {
    facebook: "https://www.facebook.com/p/Santa-Cruz-Grupo-Inmobiliario-61591952656013/",
    instagram: "https://www.instagram.com/santa_cruz_inmobiliaria/"
  },
  form: {
    labels: {
      name: "Nombres",
      lastName: "Apellidos",
      docNumber: "Número de documento",
      email: "Email",
      phone: "Celular",
      preference: "Deseo ser contactado por",
      schedule: "Horario de preferencia",
      terms: "Acepto las Políticas de Privacidad y Términos y Condiciones",
      auth: "Autorizo a actividades de prospección comercial"
    }
  }
};
