import { useEffect, useState } from 'react';
import { X, Check, User, Phone, Siren } from 'lucide-react';
import { Gender, UserProfile, useAppContext } from '../context/AppContext';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EmergencyContact = {
  name: string;
  phone: string;
  message: string;
};

const DEFAULT_EMERGENCY_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  message: 'אני צריך עזרה דחופה. זה המיקום שלי:',
};

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { userProfile, saveUserProfile, theme } = useAppContext();

  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age);
  const [gender, setGender] = useState<Gender>(userProfile.gender);
  const [diabetesType, setDiabetesType] = useState<'1' | '2' | ''>(userProfile.diabetesType);
  const [saved, setSaved] = useState(false);

  const [emergencyName, setEmergencyName] = useState(DEFAULT_EMERGENCY_CONTACT.name);
  const [emergencyPhone, setEmergencyPhone] = useState(DEFAULT_EMERGENCY_CONTACT.phone);
  const [emergencyMessage, setEmergencyMessage] = useState(DEFAULT_EMERGENCY_CONTACT.message);

  useEffect(() => {
    if (!isOpen) return;

    setName(userProfile.name);
    setAge(userProfile.age);
    setGender(userProfile.gender);
    setDiabetesType(userProfile.diabetesType);

    try {
      const raw = localStorage.getItem('emergency_contact');
      if (raw) {
        const parsed = JSON.parse(raw);
        setEmergencyName(parsed?.name || '');
        setEmergencyPhone(parsed?.phone || '');
        setEmergencyMessage(parsed?.message || DEFAULT_EMERGENCY_CONTACT.message);
      } else {
        setEmergencyName('');
        setEmergencyPhone('');
        setEmergencyMessage(DEFAULT_EMERGENCY_CONTACT.message);
      }
    } catch {
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyMessage(DEFAULT_EMERGENCY_CONTACT.message);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: UserProfile = {
      name: name.trim() || userProfile.name,
      age,
      gender,
      diabetesType,
    };

    saveUserProfile(updated);

    localStorage.setItem(
      'emergency_contact',
      JSON.stringify({
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        message: emergencyMessage.trim() || DEFAULT_EMERGENCY_CONTACT.message,
      })
    );

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const isValid = name.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl px-5 pt-3 pb-10"
        style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.2)', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: '#E5E7EB' }} />

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: theme.primaryBg }}
          >
            <X size={20} strokeWidth={2} style={{ color: theme.primary }} />
          </button>

          <div className="text-center">
            <h2 className="text-base" style={{ color: '#1F2937', fontWeight: 800, letterSpacing: '-0.02em' }}>
              הגדרות פרופיל
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.primaryMuted, fontWeight: 500 }}>
              עדכן את הפרטים שלך
            </p>
          </div>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: theme.primaryBg }}
          >
            <User size={18} strokeWidth={1.5} style={{ color: theme.primary }} />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
              שם
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              dir="rtl"
              className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
              style={{
                border: `2px solid ${name.trim() ? theme.primaryBorder : '#F3F4F6'}`,
                backgroundColor: name.trim() ? theme.primaryBg : '#F9FAFB',
                color: '#1F2937',
                fontWeight: 500,
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
              מגדר
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'female' as Gender, label: 'נקבה', emoji: '👩' },
                { value: 'male' as Gender, label: 'זכר', emoji: '👨' },
              ]).map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setGender(value)}
                  className="rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
                  style={{
                    border: `2px solid ${gender === value ? theme.primary : '#F3F4F6'}`,
                    backgroundColor: gender === value ? theme.primaryBg : '#F9FAFB',
                    boxShadow: gender === value ? `0 4px 16px ${theme.primary}20` : 'none',
                  }}
                >
                  <span className="text-xl">{emoji}</span>
                  <span style={{ color: gender === value ? theme.primary : '#374151', fontWeight: 700 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
              גיל
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              dir="rtl"
              min="1"
              max="120"
              placeholder="גיל"
              className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
              style={{
                border: `2px solid ${age ? theme.primaryBorder : '#F3F4F6'}`,
                backgroundColor: age ? theme.primaryBg : '#F9FAFB',
                color: '#1F2937',
                fontWeight: 500,
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
              סוג סוכרת
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['1', '2'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDiabetesType(type)}
                  className="rounded-2xl py-3.5 text-center transition-all duration-200 active:scale-[0.97]"
                  style={{
                    border: `2px solid ${diabetesType === type ? theme.primary : '#F3F4F6'}`,
                    backgroundColor: diabetesType === type ? theme.primaryBg : '#F9FAFB',
                    boxShadow: diabetesType === type ? `0 4px 16px ${theme.primary}20` : 'none',
                  }}
                >
                  <p style={{ color: diabetesType === type ? theme.primary : '#374151', fontWeight: 800, fontSize: '1rem' }}>
                    סוג {type}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: diabetesType === type ? theme.primaryDark : '#9CA3AF' }}>
                    {type === '1' ? 'תלוית אינסולין' : 'ללא אינסולין'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-3xl p-4"
            style={{
              border: `2px solid ${theme.primaryBorder}`,
              backgroundColor: theme.primaryBg,
            }}
          >
            <div className="flex items-center justify-end gap-2 mb-4">
              <h3 className="text-sm" style={{ color: '#1F2937', fontWeight: 800 }}>
                איש קשר לחירום
              </h3>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'white' }}
              >
                <Siren size={18} strokeWidth={1.8} style={{ color: theme.primary }} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
                  שם איש קשר
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  dir="rtl"
                  placeholder="אמא, אבא, בן זוג..."
                  className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                  style={{
                    border: `2px solid ${emergencyName.trim() ? theme.primaryBorder : '#F3F4F6'}`,
                    backgroundColor: 'white',
                    color: '#1F2937',
                    fontWeight: 500,
                  }}
                />
              </div>

              <div>
                <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
                  טלפון איש קשר
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    strokeWidth={2}
                    style={{
                      color: theme.primaryMuted,
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    dir="rtl"
                    placeholder="0501234567"
                    className="w-full h-13 px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                    style={{
                      border: `2px solid ${emergencyPhone.trim() ? theme.primaryBorder : '#F3F4F6'}`,
                      backgroundColor: 'white',
                      color: '#1F2937',
                      fontWeight: 500,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-right mb-2" style={{ color: '#6B7280', fontWeight: 600 }}>
                  הודעת חירום
                </label>
                <textarea
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl text-right text-base outline-none transition-all"
                  style={{
                    border: `2px solid ${theme.primaryBorder}`,
                    backgroundColor: 'white',
                    color: '#1F2937',
                    fontWeight: 500,
                    minHeight: '88px',
                    resize: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full h-14 rounded-2xl mt-6 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97]"
          style={{
            backgroundColor: saved ? '#16A34A' : isValid ? theme.primary : '#F3F4F6',
            color: isValid ? '#FFFFFF' : '#9CA3AF',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: isValid ? `0 6px 24px ${theme.primaryShadow}` : 'none',
          }}
        >
          {saved ? (
            <>
              <Check size={18} strokeWidth={2.5} />
              <span>נשמר!</span>
            </>
          ) : (
            <span>שמור שינויים</span>
          )}
        </button>
      </div>
    </div>
  );
}
