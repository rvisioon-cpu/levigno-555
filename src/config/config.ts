export interface ConfigProps {
  appName: string;
  appDescription: string;
  domainName: string;
  resend: {
    fromNoReply: string;
    fromAdmin: string;
    supportEmail: string;
  };
  colors: {
    theme: "light" | "dark";
    main: string;
  };
  auth: {
    loginUrl: string;
    callbackUrl: string;
  };
  company: {
    name: string;
    address: string;
    buildingName: string;
    buildingAddress: string;
    email: string;
    website: string;
    // Provincia/departamento donde opera la inmobiliaria. Aparece en el
    // encabezado de las páginas legales ("ubicada en ..., Lima, Perú"): no
    // todos los proyectos están en Lima, así que no se puede fijar en el texto.
    city: string;
    country: string;
    // Teléfono de la inmobiliaria para las páginas legales. Si queda vacío, la
    // fila del teléfono no se pinta en lugar de mostrar un campo hueco.
    phone?: string;
    maquetaUrl?: string;
    buildingSocials: {
      facebook: string;
      instagram: string;
      tiktok: string;
    };
    realStateName: string;
    realStateSlogan: string;
    realStateSocials: {
      facebook: string;
      instagram: string;
      tiktok: string;
    };
    developer: string;
    developerSlogan: string;
    developerSocials: {
      facebook: string;
      instagram: string;
      tiktok: string;
    };
  };
}

const config: ConfigProps = {
  appName: "Levigno",
  appDescription: "Experiencia virtual de Levigno.",
  domainName: "levigno.pe",
  resend: {
    fromNoReply: `Levigno <noreply@levigno.pe>`,
    fromAdmin: `Admin at Levigno <admin@levigno.pe>`,
    supportEmail: "ventas@levigno.pe",
  },
  colors: {
    theme: "light",
    main: "#F59C1D", // Brand main color
  },
  auth: {
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
  company: {
    name: "Levigno",
    address: "",
    buildingName: "Levigno",
    buildingAddress: "",
    email: "ventas@levigno.pe",
    website: "https://levigno.pe/",
    city: "Lima",
    country: "Perú",
    phone: "",
    maquetaUrl: "",
    buildingSocials: {
      facebook: "",
      instagram: "",
      tiktok: ""
    },
    realStateName: "Levigno",
    realStateSlogan: "",
    realStateSocials: {
      facebook: "",
      instagram: "",
      tiktok: ""
    },
    developer: "Rvisioon",
    developerSlogan: "Creamos experiencias visuales que conectan, inspiran y venden.",
    developerSocials: {
      facebook: "https://www.facebook.com/rvisioon",
      instagram: "https://www.instagram.com/rvisioon",
      tiktok: "https://www.tiktok.com/@rvisioon"
    }
  }
};

export default config;
