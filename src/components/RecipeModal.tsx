import { X, ChefHat, ListOrdered, ShoppingBasket } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export interface RecipeDetail {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  carbs: string;
  protein: string;
  tags: string[];
}

interface RecipeModalProps {
  recipe: RecipeDetail;
  onClose: () => void;
}

export function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const { theme } = useAppContext();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.25)', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full object-cover"
            style={{ height: 180 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <X size={18} strokeWidth={2.5} style={{ color: '#1F2937' }} />
          </button>
          <div className="absolute bottom-0 right-0 p-4">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs mb-2"
              style={{ backgroundColor: theme.primaryBg, color: theme.primary, fontWeight: 700 }}
            >
              <ChefHat size={13} strokeWidth={2} />
              <span>{recipe.type}</span>
            </div>
            <h2 className="text-xl text-right" style={{ color: '#FFFFFF', fontWeight: 900, letterSpacing: '-0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {recipe.name}
            </h2>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
          <div className="px-6 pt-5 pb-8">
            <div
              className="flex items-center justify-around rounded-2xl p-4 mb-6"
              style={{ backgroundColor: theme.primaryBg, border: `1.5px solid ${theme.primaryBorder}` }}
            >
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: theme.primaryMuted, fontWeight: 500 }}>פחמימות</p>
                <p className="text-lg" style={{ color: theme.primary, fontWeight: 900 }}>{recipe.carbs}</p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: theme.primaryBorder }} />
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: theme.primaryMuted, fontWeight: 500 }}>חלבון</p>
                <p className="text-lg" style={{ color: theme.primary, fontWeight: 900 }}>{recipe.protein}</p>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: theme.primaryBorder }} />
              <div className="flex flex-wrap gap-1 justify-center max-w-[100px]">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: `${theme.primary}15`, color: theme.primaryDark, fontWeight: 600 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-end gap-2 mb-3">
                <h3 className="text-base" style={{ color: '#1F2937', fontWeight: 800 }}>מצרכים</h3>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryBg }}
                >
                  <ShoppingBasket size={16} strokeWidth={2} style={{ color: theme.primary }} />
                </div>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1.5px solid ${theme.primaryBorder}` }}
              >
                {recipe.ingredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 text-right"
                    style={{
                      borderBottom: idx < recipe.ingredients.length - 1 ? `1px solid ${theme.primaryBorder}` : 'none',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : theme.primaryBg,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <p className="text-sm flex-1" style={{ color: '#374151', fontWeight: 500 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-end gap-2 mb-3">
                <h3 className="text-base" style={{ color: '#1F2937', fontWeight: 800 }}>אופן הכנה</h3>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryBg }}
                >
                  <ListOrdered size={16} strokeWidth={2} style={{ color: theme.primary }} />
                </div>
              </div>
              <div className="space-y-3">
                {recipe.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${theme.primaryBorder}`,
                      boxShadow: `0 2px 8px ${theme.primary}08`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: theme.gradientCard }}
                    >
                      <span className="text-xs font-black" style={{ color: '#FFFFFF' }}>{idx + 1}</span>
                    </div>
                    <p className="text-sm leading-relaxed flex-1 text-right" style={{ color: '#374151', fontWeight: 500 }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
