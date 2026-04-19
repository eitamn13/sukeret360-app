import { type ReactNode, useMemo, useState } from 'react';
import { CheckSquare, Coffee, Droplets, Moon, Sparkles, Square, Sun, Target, ShieldCheck, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OverlayHeader } from './OverlayHeader';
import { RecipeModal, RecipeDetail } from './RecipeModal';

interface MealSuggestionsScreenProps {
  onClose: () => void;
}

interface HabitItem {
  id: string;
  label: string;
  icon: string;
}

interface MealCompass {
  title: string;
  highlight: string;
  caution: string;
  nextStep: string;
}

const meals: RecipeDetail[] = [
  {
    id: 'breakfast',
    type: '׳׳¨׳•׳—׳× ׳‘׳•׳§׳¨',
    name: '׳—׳‘׳™׳×׳” ׳¢׳ ׳™׳¨׳§׳•׳× ׳•׳׳—׳ ׳׳׳',
    imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    carbs: '18 ׳’׳¨׳',
    protein: '14 ׳’׳¨׳',
    tags: ['׳—׳׳‘׳•׳ ׳˜׳•׳‘', '׳׳×׳׳™׳ ׳׳‘׳•׳§׳¨'],
    ingredients: ['2 ׳‘׳™׳¦׳™׳', '׳¡׳׳˜ ׳™׳¨׳§׳•׳× ׳§׳˜׳', '׳₪׳¨׳•׳¡׳× ׳׳—׳ ׳׳׳', '׳›׳₪׳™׳× ׳©׳׳ ׳–׳™׳×'],
    instructions: [
      '׳׳›׳™׳ ׳™׳ ׳—׳‘׳™׳×׳” ׳¨׳›׳” ׳¢׳ ׳׳¢׳˜ ׳©׳׳.',
      '׳׳’׳™׳©׳™׳ ׳׳¦׳“ ׳¡׳׳˜ ׳™׳¨׳§׳•׳× ׳˜׳¨׳™.',
      '׳׳•׳¡׳™׳₪׳™׳ ׳₪׳¨׳•׳¡׳× ׳׳—׳ ׳׳׳ ׳‘׳׳ ׳” ׳׳“׳•׳“׳”.',
      '׳׳ ׳¨׳•׳¦׳™׳, ׳׳©׳׳‘׳™׳ ׳§׳•׳˜׳’׳³ ׳§׳˜׳ ׳׳• ׳’׳‘׳™׳ ׳” ׳׳‘׳ ׳”.',
    ],
  },
  {
    id: 'lunch',
    type: '׳׳¨׳•׳—׳× ׳¦׳”׳¨׳™׳™׳',
    name: '׳¢׳•׳£ ׳¦׳׳•׳™, ׳§׳™׳ ׳•׳׳” ׳•׳‘׳¨׳•׳§׳•׳׳™',
    imageUrl: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    carbs: '30 ׳’׳¨׳',
    protein: '36 ׳’׳¨׳',
    tags: ['׳©׳•׳‘׳¢ ׳׳¨׳•׳', '׳׳™׳–׳•׳ ׳˜׳•׳‘'],
    ingredients: ['׳—׳–׳” ׳¢׳•׳£', '׳—׳¦׳™ ׳›׳•׳¡ ׳§׳™׳ ׳•׳׳”', '׳‘׳¨׳•׳§׳•׳׳™ ׳׳׳•׳“׳”', '׳×׳™׳‘׳•׳ ׳¢׳“׳™׳'],
    instructions: [
      '׳¦׳•׳׳™׳ ׳׳× ׳”׳¢׳•׳£ ׳¢׳“ ׳©׳”׳•׳ ׳׳•׳›׳.',
      '׳׳‘׳©׳׳™׳ ׳§׳™׳ ׳•׳׳” ׳‘׳׳ ׳” ׳׳“׳•׳“׳”.',
      '׳׳•׳¡׳™׳₪׳™׳ ׳‘׳¨׳•׳§׳•׳׳™ ׳׳׳•׳“׳” ׳׳• ׳™׳¨׳§׳•׳× ׳™׳¨׳•׳§׳™׳.',
      '׳׳’׳™׳©׳™׳ ׳¦׳׳—׳× ׳׳׳•׳–׳ ׳× ׳¢׳ ׳—׳׳‘׳•׳, ׳™׳¨׳§׳•׳× ׳•׳₪׳—׳׳™׳׳” ׳׳“׳•׳“׳”.',
    ],
  },
  {
    id: 'dinner',
    type: '׳׳¨׳•׳—׳× ׳¢׳¨׳‘',
    name: '׳¡׳׳˜ ׳¡׳׳׳•׳ ׳•׳׳‘׳•׳§׳“׳•',
    imageUrl: 'https://images.pexels.com/photos/842571/pexels-photo-842571.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    carbs: '12 ׳’׳¨׳',
    protein: '28 ׳’׳¨׳',
    tags: ['׳§׳ ׳׳¢׳¨׳‘', '׳׳•׳׳’׳” 3'],
    ingredients: ['׳¡׳׳׳•׳ ׳׳₪׳•׳™', '׳׳‘׳•׳§׳“׳•', '׳¢׳׳™ ׳—׳¡׳”', '׳¢׳’׳‘׳ ׳™׳•׳× ׳©׳¨׳™', '׳׳™׳׳•׳'],
    instructions: [
      '׳׳•׳₪׳™׳ ׳׳× ׳”׳¡׳׳׳•׳ ׳‘׳×׳™׳‘׳•׳ ׳¢׳“׳™׳.',
      '׳׳¨׳›׳™׳‘׳™׳ ׳¡׳׳˜ ׳’׳“׳•׳ ׳¢׳ ׳—׳¡׳”, ׳¢׳’׳‘׳ ׳™׳•׳× ׳•׳׳‘׳•׳§׳“׳•.',
      '׳׳ ׳™׳—׳™׳ ׳׳¢׳ ׳׳× ׳”׳¡׳׳׳•׳ ׳•׳׳•׳¡׳™׳₪׳™׳ ׳׳™׳׳•׳.',
      '׳׳ ׳¦׳¨׳™׳ ׳™׳•׳×׳¨ ׳©׳•׳‘׳¢, ׳׳©׳׳‘׳™׳ ׳’׳ ׳×׳•׳¡׳₪׳× ׳§׳˜׳ ׳” ׳׳“׳•׳“׳”.',
    ],
  },
];

const habits: HabitItem[] = [
  { id: 'water', label: '׳©׳×׳™׳×׳™ 8 ׳›׳•׳¡׳•׳× ׳׳™׳', icon: 'נ’§' },
  { id: 'walk', label: '׳”׳׳›׳×׳™ ׳׳₪׳—׳•׳× 20 ׳“׳§׳•׳×', icon: 'נ¶' },
  { id: 'feet', label: '׳‘׳“׳§׳×׳™ ׳›׳₪׳•׳× ׳¨׳’׳׳™׳™׳', icon: 'נ¦¶' },
  { id: 'meds', label: '׳׳§׳—׳×׳™ ׳×׳¨׳•׳₪׳•׳× ׳‘׳–׳׳', icon: 'נ’' },
  { id: 'sugar', label: '׳‘׳“׳§׳×׳™ ׳¨׳׳× ׳¡׳•׳›׳¨', icon: 'נ©¸' },
];

const SMART_SWAPS = [
  {
    id: 'bread',
    from: '׳׳—׳ ׳׳‘׳',
    to: '׳׳—׳ ׳׳׳ ׳׳• ׳˜׳•׳¡׳˜ ׳§׳',
    why: '׳™׳›׳•׳ ׳׳¢׳–׳•׳¨ ׳׳¢׳׳™׳™׳” ׳׳×׳•׳ ׳” ׳™׳•׳×׳¨ ׳‘׳¡׳•׳›׳¨',
  },
  {
    id: 'drink',
    from: '׳׳™׳¥ ׳׳×׳•׳§',
    to: '׳׳™׳ ׳¢׳ ׳ ׳¢׳ ׳¢ ׳׳• ׳¡׳•׳“׳”',
    why: '׳׳•׳¨׳™׳“ ׳¢׳•׳׳¡ ׳¡׳•׳›׳¨ ׳׳™׳•׳×׳¨ ׳‘׳׳¨׳•׳—׳”',
  },
  {
    id: 'snack',
    from: '׳¢׳•׳’׳™׳™׳” ׳׳• ׳•׳•׳₪׳',
    to: '׳™׳•׳’׳•׳¨׳˜ ׳¢׳ ׳©׳§׳“׳™׳',
    why: '׳׳©׳׳™׳¨ ׳™׳•׳×׳¨ ׳©׳•׳‘׳¢ ׳•׳₪׳—׳•׳× ׳§׳₪׳™׳¦׳”',
  },
];

const MEAL_ICONS: Record<string, ReactNode> = {
  breakfast: <Coffee size={17} strokeWidth={1.75} />,
  lunch: <Sun size={17} strokeWidth={1.75} />,
  dinner: <Moon size={17} strokeWidth={1.75} />,
};

function renderHabitIcon(habitId: string) {
  switch (habitId) {
    case 'water':
      return <Droplets size={18} strokeWidth={1.9} />;
    case 'walk':
      return <Zap size={18} strokeWidth={1.9} />;
    case 'feet':
      return <ShieldCheck size={18} strokeWidth={1.9} />;
    case 'meds':
      return <CheckSquare size={18} strokeWidth={1.9} />;
    case 'sugar':
      return <Target size={18} strokeWidth={1.9} />;
    default:
      return <Square size={18} strokeWidth={1.9} />;
  }
}

function getSmartMealMoment(
  latestSugar: { level: number; contextLabel: string } | null,
  targetLow: number,
  targetHigh: number
) {
  if (!latestSugar) {
    return {
      title: '׳ ׳‘׳ ׳” ׳”׳×׳—׳׳” ׳¨׳’׳•׳¢׳”',
      body: '׳׳™׳ ׳¢׳“׳™׳™׳ ׳׳“׳™׳“׳” ׳׳—׳¨׳•׳ ׳”, ׳׳– ׳¢׳“׳™׳£ ׳׳‘׳—׳•׳¨ ׳׳¨׳•׳—׳” ׳₪׳©׳•׳˜׳” ׳•׳׳׳•׳–׳ ׳× ׳¢׳ ׳—׳׳‘׳•׳, ׳™׳¨׳§׳•׳× ׳•׳₪׳—׳׳™׳׳” ׳׳“׳•׳“׳”.',
      tips: ['׳¦׳׳—׳× ׳׳׳•׳–׳ ׳×', '׳׳ ׳” ׳׳“׳•׳“׳”', '׳©׳×׳™׳™׳” ׳׳׳ ׳¡׳•׳›׳¨'],
      colors: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    };
  }

  if (latestSugar.level < targetLow) {
    return {
      title: '׳§׳•׳“׳ ׳׳¢׳׳™׳, ׳׳—׳¨ ׳›׳ ׳׳•׳›׳׳™׳ ׳¨׳’׳•׳¢',
      body: `׳”׳׳“׳™׳“׳” ׳”׳׳—׳¨׳•׳ ׳” ׳”׳™׳™׳×׳” ${latestSugar.level} ׳¡׳‘׳™׳‘ ${latestSugar.contextLabel}. ׳¢׳“׳™׳£ ׳׳˜׳₪׳ ׳§׳•׳“׳ ׳‘׳™׳¨׳™׳“׳”, ׳•׳¨׳§ ׳׳—׳¨ ׳›׳ ׳׳¢׳‘׳•׳¨ ׳׳׳¨׳•׳—׳” ׳׳¡׳•׳“׳¨׳×.`,
      tips: ['15 ׳’׳¨׳ ׳₪׳—׳׳™׳׳” ׳׳”׳™׳¨׳”', '׳‘׳“׳™׳§׳” ׳—׳•׳–׳¨׳× ׳׳—׳¨׳™ 15 ׳“׳§׳•׳×', '׳׳—׳¨ ׳›׳ ׳׳¨׳•׳—׳” ׳§׳׳”'],
      colors: { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' },
    };
  }

  if (latestSugar.level > targetHigh) {
    return {
      title: '׳‘׳•׳—׳¨׳™׳ ׳׳¨׳•׳—׳” ׳׳¨׳’׳™׳¢׳” ׳™׳•׳×׳¨',
      body: `׳”׳׳“׳™׳“׳” ׳”׳׳—׳¨׳•׳ ׳” ׳”׳™׳™׳×׳” ${latestSugar.level}. ׳›׳¨׳’׳¢ ׳¢׳“׳™׳£ ׳׳׳›׳× ׳¢׳ ׳—׳׳‘׳•׳, ׳™׳¨׳§׳•׳× ׳•׳ ׳•׳–׳׳™׳, ׳•׳׳”׳׳˜ ׳¢׳ ׳¢׳•׳׳¡ ׳₪׳—׳׳™׳׳•׳×.`,
      tips: ['׳₪׳—׳•׳× ׳¢׳•׳׳¡ ׳₪׳—׳׳™׳׳•׳×', '׳™׳•׳×׳¨ ׳—׳׳‘׳•׳', '׳¦׳׳—׳× ׳₪׳©׳•׳˜׳”'],
      colors: { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' },
    };
  }

  return {
    title: '׳–׳” ׳–׳׳ ׳˜׳•׳‘ ׳׳׳¨׳•׳—׳” ׳׳׳•׳–׳ ׳×',
    body: `׳”׳׳“׳™׳“׳” ׳”׳׳—׳¨׳•׳ ׳” ׳”׳™׳™׳×׳” ${latestSugar.level}, ׳•׳–׳” ׳ ׳¨׳׳” ׳—׳׳•׳ ׳˜׳•׳‘ ׳׳׳¨׳•׳—׳” ׳׳¡׳•׳“׳¨׳× ׳¢׳ ׳₪׳—׳׳™׳׳” ׳׳“׳•׳“׳” ׳•׳—׳׳‘׳•׳.`,
    tips: ['׳₪׳—׳׳™׳׳” ׳׳“׳•׳“׳”', '׳—׳׳‘׳•׳ ׳׳©׳•׳‘׳¢', '׳™׳¨׳§׳•׳× ׳׳ ׳₪׳—'],
    colors: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' },
  };
}

function getMealCompass(
  latestSugar: { level: number; contextLabel: string } | null,
  targetLow: number,
  targetHigh: number
): MealCompass {
  if (!latestSugar) {
    return {
      title: '׳׳¦׳₪׳ ׳׳¨׳•׳—׳” ׳—׳›׳',
      highlight: '׳”׳×׳—׳™׳׳• ׳׳¦׳׳—׳× ׳׳׳•׳–׳ ׳× ׳¢׳ ׳—׳׳‘׳•׳, ׳™׳¨׳§׳•׳× ׳•׳₪׳—׳׳™׳׳” ׳׳“׳•׳“׳”.',
      caution: '׳׳ ׳—׳™׳™׳‘׳™׳ ׳׳”׳×׳—׳™׳ ׳׳׳ ׳” ׳›׳‘׳“׳” ׳׳• ׳©׳×׳™׳™׳” ׳׳×׳•׳§׳”.',
      nextStep: '׳‘׳“׳§׳• ׳₪׳¢׳ ׳׳—׳× ׳׳₪׳ ׳™ ׳׳• ׳׳—׳¨׳™ ׳׳¨׳•׳—׳” ׳”׳™׳•׳ ׳›׳“׳™ ׳©׳ ׳•׳›׳ ׳׳“׳™׳™׳§ ׳¢׳•׳“ ׳™׳•׳×׳¨.',
    };
  }

  if (latestSugar.level < targetLow) {
    return {
      title: '׳׳” ׳׳¢׳©׳•׳× ׳›׳©׳™׳© ׳™׳¨׳™׳“׳”',
      highlight: '׳§׳•׳“׳ ׳₪׳—׳׳™׳׳” ׳׳”׳™׳¨׳” ׳•׳׳“׳•׳“׳”, ׳•׳׳– ׳׳¨׳•׳—׳” ׳§׳˜׳ ׳” ׳¢׳ ׳—׳׳‘׳•׳.',
      caution: '׳׳ ׳¨׳¦׳™׳ ׳™׳©׳¨ ׳׳׳¨׳•׳—׳” ׳’׳“׳•׳׳” ׳©׳¢׳׳•׳׳” ׳׳”׳§׳₪׳™׳¥ ׳׳× ׳”׳¡׳•׳›׳¨.',
      nextStep: '׳‘׳“׳§׳• ׳©׳•׳‘ ׳‘׳¢׳•׳“ ׳›-15 ׳“׳§׳•׳× ׳•׳¨׳§ ׳׳– ׳¢׳‘׳¨׳• ׳׳׳¨׳•׳—׳” ׳¨׳’׳•׳¢׳”.',
    };
  }

  if (latestSugar.level > targetHigh) {
    return {
      title: '׳׳” ׳¢׳“׳™׳£ ׳›׳¨׳’׳¢ ׳›׳©׳™׳© ׳¢׳׳™׳™׳”',
      highlight: '׳׳›׳• ׳¢׳ ׳—׳׳‘׳•׳, ׳™׳¨׳§׳•׳× ׳•׳©׳•׳‘׳¢ ׳‘׳׳™ ׳׳”׳¢׳׳™׳¡ ׳₪׳—׳׳™׳׳•׳×.',
      caution: '׳›׳“׳׳™ ׳׳”׳׳˜ ׳¢׳ ׳׳—׳ ׳׳‘׳, ׳׳™׳¦׳™׳ ׳׳• ׳§׳™׳ ׳•׳—׳™׳ ׳׳”׳™׳¨׳™׳.',
      nextStep: '׳‘׳—׳¨׳• ׳׳ ׳” ׳₪׳©׳•׳˜׳” ׳™׳•׳×׳¨ ׳•׳‘׳“׳§׳• ׳©׳•׳‘ ׳׳—׳¨׳™ ׳”׳׳¨׳•׳—׳”.',
    };
  }

  return {
    title: '׳”׳–׳׳ ׳”׳˜׳•׳‘ ׳‘׳™׳•׳×׳¨ ׳׳׳¨׳•׳—׳” ׳׳׳•׳–׳ ׳×',
    highlight: '׳–׳” ׳¨׳’׳¢ ׳˜׳•׳‘ ׳׳©׳׳‘ ׳₪׳—׳׳™׳׳” ׳׳“׳•׳“׳” ׳¢׳ ׳—׳׳‘׳•׳ ׳•׳™׳¨׳§׳•׳×.',
    caution: '׳’׳ ׳‘׳׳¦׳‘ ׳˜׳•׳‘, ׳¢׳“׳™׳£ ׳׳ ׳׳”׳¢׳׳™׳¡ ׳׳ ׳•׳× ׳’׳“׳•׳׳•׳× ׳‘׳׳™ ׳×׳©׳•׳׳× ׳׳‘ ׳׳›׳׳•׳×.',
    nextStep: '׳‘׳—׳¨׳• ׳׳—׳× ׳׳”׳׳¨׳•׳—׳•׳× ׳›׳׳ ׳׳• ׳‘׳ ׳• ׳¦׳׳—׳× ׳“׳•׳׳” ׳‘׳‘׳™׳×.',
  };
}

export function MealSuggestionsScreen({ onClose }: MealSuggestionsScreenProps) {
  const { theme, sugarLogs, userProfile } = useAppContext();
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);

  const targetLow = Number(userProfile.targetLow || 80);
  const targetHigh = Number(userProfile.targetHigh || 140);
  const latestSugar = sugarLogs[0] ?? null;

  const smartMoment = useMemo(
    () =>
      getSmartMealMoment(
        latestSugar
          ? { level: latestSugar.level, contextLabel: latestSugar.contextLabel }
          : null,
        targetLow,
        targetHigh
      ),
    [latestSugar, targetHigh, targetLow]
  );

  const mealCompass = useMemo(
    () =>
      getMealCompass(
        latestSugar
          ? { level: latestSugar.level, contextLabel: latestSugar.contextLabel }
          : null,
        targetLow,
        targetHigh
      ),
    [latestSugar, targetHigh, targetLow]
  );

  const toggleHabit = (id: string) => {
    setCompletedHabits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const completedCount = completedHabits.size;
  const totalHabits = habits.length;
  const allDone = completedCount === totalHabits;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-slide-in-right"
        style={{ background: theme.gradientFull }}
      >
        <OverlayHeader
          title="׳”׳¦׳¢׳•׳× ׳׳¨׳•׳—׳”"
          subtitle="׳×׳₪׳¨׳™׳˜ ׳—׳›׳, ׳”׳—׳׳₪׳•׳× ׳׳”׳™׳¨׳•׳× ׳•׳”׳¨׳’׳׳™׳ ׳©׳¢׳•׳–׳¨׳™׳ ׳׳©׳׳•׳¨ ׳¢׳ ׳׳™׳–׳•׳"
          theme={theme}
          onBack={onClose}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <p
            className="text-xs uppercase tracking-widest pr-1"
            style={{ color: theme.primaryMuted, fontWeight: 700, letterSpacing: '0.12em' }}
          >
            ׳×׳₪׳¨׳™׳˜ ׳™׳•׳׳™ ׳—׳›׳
          </p>

          <div
            className="rounded-3xl p-5"
            style={{ backgroundColor: smartMoment.colors.bg, border: `1.5px solid ${smartMoment.colors.border}` }}
          >
            <div className="flex items-center justify-end gap-2 mb-2">
              <p style={{ color: smartMoment.colors.color, fontWeight: 900, fontSize: 19 }}>{smartMoment.title}</p>
              <Sparkles size={18} strokeWidth={1.8} style={{ color: smartMoment.colors.color }} />
            </div>
            <p style={{ color: smartMoment.colors.color, lineHeight: 1.8, fontWeight: 500 }}>
              {smartMoment.body}
            </p>

            <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-3">
              {smartMoment.tips.map((tip) => (
                <div
                  key={tip}
                  className="rounded-2xl p-3 text-center"
                  style={{ backgroundColor: '#FFFFFF', border: `1px solid ${smartMoment.colors.border}` }}
                >
                  <p style={{ color: smartMoment.colors.color, fontWeight: 800, fontSize: 13 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-3xl p-5 bg-white"
            style={{ border: `1.5px solid ${theme.primaryBorder}`, boxShadow: `0 2px 12px ${theme.primary}0D` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 800 }}
              >
                ׳—׳“׳© ׳•׳™׳™׳—׳•׳“׳™
              </span>
              <div className="text-right">
                <p style={{ color: '#0F172A', fontWeight: 900, fontSize: 18 }}>{mealCompass.title}</p>
                <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>
                  ׳”׳׳׳¦׳” ׳׳”׳™׳¨׳” ׳׳₪׳™ ׳׳¦׳‘ ׳”׳¡׳•׳›׳¨ ׳”׳׳—׳¨׳•׳ ׳©׳׳
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <div className="flex items-center justify-end gap-2 mb-2">
                  <p style={{ color: '#1D4ED8', fontWeight: 900 }}>׳׳” ׳›׳ ׳׳‘׳—׳•׳¨</p>
                  <Target size={17} style={{ color: '#1D4ED8' }} />
                </div>
                <p style={{ color: '#1D4ED8', lineHeight: 1.7, fontWeight: 600 }}>{mealCompass.highlight}</p>
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <div className="flex items-center justify-end gap-2 mb-2">
                  <p style={{ color: '#C2410C', fontWeight: 900 }}>׳׳” ׳׳”׳׳˜ ׳¢׳›׳©׳™׳•</p>
                  <ShieldCheck size={17} style={{ color: '#C2410C' }} />
                </div>
                <p style={{ color: '#C2410C', lineHeight: 1.7, fontWeight: 600 }}>{mealCompass.caution}</p>
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="flex items-center justify-end gap-2 mb-2">
                  <p style={{ color: '#15803D', fontWeight: 900 }}>׳”׳¦׳¢׳“ ׳”׳‘׳</p>
                  <Zap size={17} style={{ color: '#15803D' }} />
                </div>
                <p style={{ color: '#15803D', lineHeight: 1.7, fontWeight: 600 }}>{mealCompass.nextStep}</p>
              </div>
            </div>
          </div>

          {meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setSelectedRecipe(meal)}
              className="w-full bg-white rounded-2xl overflow-hidden text-right transition-all duration-200 active:scale-[0.98]"
              style={{
                border: `1.5px solid ${theme.primaryBorder}`,
                boxShadow: `0 2px 12px ${theme.primary}0D`,
              }}
            >
              <div className="relative">
                <img
                  src={meal.imageUrl}
                  alt={meal.name}
                  className="w-full object-cover"
                  style={{ height: 130 }}
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }}
                />
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs"
                  style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700 }}
                >
                  {MEAL_ICONS[meal.id]}
                  <span>{meal.type}</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-base text-right mb-1.5" style={{ color: '#1F2937', fontWeight: 800 }}>
                  {meal.name}
                </h3>

                <div className="flex items-center justify-end gap-2 mb-3">
                  {meal.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 600 }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="flex items-center justify-around rounded-xl p-3"
                  style={{ backgroundColor: theme.primaryBg, border: `1px solid ${theme.primaryBorder}` }}
                >
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>׳₪׳—׳׳™׳׳•׳×</p>
                    <p className="text-base" style={{ color: theme.primary, fontWeight: 900 }}>{meal.carbs}</p>
                  </div>
                  <div className="w-px h-9" style={{ backgroundColor: theme.primaryBorder }} />
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>׳—׳׳‘׳•׳</p>
                    <p className="text-base" style={{ color: theme.primary, fontWeight: 900 }}>{meal.protein}</p>
                  </div>
                  <div className="w-px h-9" style={{ backgroundColor: theme.primaryBorder }} />
                  <div className="text-center">
                    <p className="text-xs mb-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>׳׳¨׳›׳™׳‘׳™׳</p>
                    <p className="text-base" style={{ color: theme.primary, fontWeight: 900 }}>{meal.ingredients.length}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}

          <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-sm px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700, border: `1px solid ${theme.primaryBorder}` }}
              >
                ׳”׳—׳׳₪׳•׳× ׳—׳›׳׳•׳×
              </span>
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: theme.primaryMuted, fontWeight: 700, letterSpacing: '0.12em' }}
              >
                ׳©׳“׳¨׳•׳’ ׳§׳˜׳, ׳”׳©׳₪׳¢׳” ׳’׳“׳•׳׳”
              </p>
            </div>

            <div className="space-y-2.5">
              {SMART_SWAPS.map((swap) => (
                <div
                  key={swap.id}
                  className="rounded-2xl p-4 bg-white"
                  style={{ border: `1.5px solid ${theme.primaryBorder}`, boxShadow: `0 1px 4px ${theme.primary}10` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 800 }}
                    >
                      {swap.why}
                    </div>
                    <div className="text-right">
                      <p style={{ color: '#0F172A', fontWeight: 900 }}>{swap.to}</p>
                      <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
                        ׳‘׳׳§׳•׳ {swap.from}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-sm px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700, border: `1px solid ${theme.primaryBorder}` }}
              >
                {completedCount} / {totalHabits}
              </span>
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: theme.primaryMuted, fontWeight: 700, letterSpacing: '0.12em' }}
              >
                ׳”׳¨׳’׳׳™׳ ׳™׳•׳׳™׳™׳
              </p>
            </div>

            <div
              className="w-full h-2.5 rounded-full mb-4 overflow-hidden"
              style={{ backgroundColor: theme.primaryBorder }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / totalHabits) * 100}%`,
                  background: allDone
                    ? 'linear-gradient(90deg,#16A34A,#22C55E)'
                    : theme.gradientCard,
                }}
              />
            </div>

            <div className="space-y-2.5">
              {habits.map((habit) => {
                const done = completedHabits.has(habit.id);
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-200 active:scale-[0.98]"
                    style={{
                      backgroundColor: done ? (allDone ? '#F0FDF4' : theme.primaryBg) : '#FFFFFF',
                      border: `1.5px solid ${done ? (allDone ? '#BBF7D0' : theme.primaryBorder) : '#F3F4F6'}`,
                      boxShadow: done ? `0 2px 8px ${theme.primary}15` : '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ color: done ? (allDone ? '#16A34A' : theme.primary) : '#D1D5DB', flexShrink: 0 }}>
                      {done
                        ? <CheckSquare size={22} strokeWidth={2} />
                        : <Square size={22} strokeWidth={1.5} />
                      }
                    </div>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl flex-shrink-0"
                      style={{
                        backgroundColor: done ? (allDone ? '#DCFCE7' : '#EFF6FF') : '#F8FAFC',
                        color: done ? (allDone ? '#15803D' : theme.primaryDark) : '#64748B',
                      }}
                    >
                      {renderHabitIcon(habit.id)}
                    </div>
                    <p
                      className="text-sm text-right flex-1"
                      style={{
                        color: done ? (allDone ? '#15803D' : theme.primaryDark) : '#374151',
                        fontWeight: done ? 700 : 500,
                      }}
                    >
                      {habit.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {allDone && (
              <div
                className="mt-5 rounded-2xl p-5 text-center"
                style={{ background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', border: '1.5px solid #BBF7D0' }}
              >
                <p className="text-xl mb-1" style={{ color: '#15803D', fontWeight: 900 }}>
                  ׳›׳ ׳”׳›׳‘׳•׳“, ׳–׳” ׳™׳•׳ ׳׳¦׳•׳™׳
                </p>
                <p className="text-sm" style={{ color: '#16A34A', fontWeight: 500 }}>
                  ׳”׳©׳׳׳× ׳׳× ׳”׳”׳¨׳’׳׳™׳ ׳”׳‘׳¨׳™׳׳™׳ ׳©׳ ׳”׳™׳•׳
                </p>
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}


