export interface HomepageData {
  hero: {
    logo: string;
    button: string;
  };
  intro: {
    poster: string;
    video: string;
  };
  slides: {
    text: string;
    highlight?: string;
  }[];
}

export const homepageData: HomepageData = {
  hero: {
    logo: "/identity/livigno-logo-negative.png",
    button: "Entrar"
  },
  intro: {
    poster: "/intro.jpg",
    video: "/videos/walk.mp4"
  },
  slides: [
    {
      text: "{{highlight}}, desarrollado por Inmobiliaria Santa Cruz, se ubica en Av. de los Patriotas 555, en el distrito de San Miguel.",
      highlight: "Livigno 555"
    },
    {
      text: "Una propuesta residencial de escala cuidada, con 42 unidades distribuidas en una torre de 17 niveles."
    },
    {
      text: "Departamentos desde 40 m² hasta 127 m², con opciones de hasta 4 dormitorios para diferentes necesidades de vivienda."
    },
    {
      text: "Disfruta de SUM, grill terrace, gimnasio, coworking, plaza interior, playground, pet zone y bike zone dentro del proyecto."
    },
    {
      text: "Una fachada vertical con balcones, acabados cálidos y áreas verdes en la parte superior le da al proyecto una presencia moderna y distintiva."
    }
  ]
};
