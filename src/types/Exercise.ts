export interface Exercise {
  id: string;
  name_en: string;
  name_ru: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: {
    id: string;
    name_ru: string;
    name_en: string;
    color_hex: string;
    icon: string;
  };
  equipment?: Array<{
    id: string;
    name_ru: string;
    name_en: string;
    required: boolean;
    icon: string;
  }>;
  muscles?: Array<{
    id: string;
    name_ru: string;
    name_en: string;
    is_primary: boolean;
  }>;
  sets_reps_duration: string;
  fun_variation: string;
  adventure_points: number;
  estimated_duration_minutes: number;
  is_balance_focused: boolean;
}