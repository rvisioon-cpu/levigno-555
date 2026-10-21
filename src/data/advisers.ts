export interface AdviserData {
  id: string;
  name: string;
  role: string;
  gender: 'male' | 'female';
  phone: string;
  email?: string;
  whatsappMessage: string;
}

export const advisersData: AdviserData[] = [
  {
    id: 'rocio',
    name: "Rocio Granja",
    role: "Sales Advisor",
    gender: 'female',
    phone: "+51959556125",
    whatsappMessage: "Hello, I'm coming from the Levigno website, I want more information"
  },
  {
    id: 'pierre',
    name: "Pierre Gurbillon",
    role: "Sales Advisor",
    gender: 'male',
    phone: "+51945656710",
    whatsappMessage: "Hello, I'm coming from the Levigno website, I want more information"
  }
];
