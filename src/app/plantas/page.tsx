import { redirect } from 'next/navigation';
import { floorsData } from '@/data/floors';

export default function PlantasRedirect() {
  const defaultFloor = floorsData.find((floor) => floor.id === '17')?.id || '17';
  redirect(`/plantas/${defaultFloor}`);
}
