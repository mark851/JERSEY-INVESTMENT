import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { InvestmentProduct } from '../types';
import { INVESTMENT_PRODUCTS as DEFAULT_PRODUCTS } from '../data/products';

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  linkTab?: string;
}

export type ThemeColorOption = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan';
export type DefaultThemeMode = 'light' | 'dark' | 'system';

export interface PlatformSettings {
  paymentLink: string;
  withdrawLink: string;
  trialBonusUGX: number;
  whatsapp: string;
  telegram: string;
  merchantId?: string;
  airtelUssd?: string;
  mtnUssd?: string;
  banners?: BannerSlide[];
  recentImages?: string[];
  themeColor?: ThemeColorOption;
  defaultThemeMode?: DefaultThemeMode;
}

export const DEFAULT_BANNERS: BannerSlide[] = [
  {
    id: 'banner-1',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    title: 'Royco Mix Agro-Industrial Processing',
    subtitle: 'Automated daily returns credited directly to your Mobile Money account',
    badge: 'Official Club Jersey',
  },
  {
    id: 'banner-2',
    imageUrl: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=800&q=80',
    title: 'UGX 3,000 Welcome Experience Bonus',
    subtitle: 'Activate your trial contract instantly upon registration with zero deposit',
    badge: 'New User Trial',
  },
  {
    id: 'banner-3',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
    title: 'Instant Checkout via Lworx Pay Solutions',
    subtitle: 'Direct automated deposit processing with real-time balance credit',
    badge: 'Secure Gateway',
  },
];

const DEFAULT_SETTINGS: PlatformSettings = {
  paymentLink: 'https://lworxpaysolutions.com/pay/royco-mix-investment',
  withdrawLink: 'https://momo.ug/payout/royco',
  trialBonusUGX: 3000,
  whatsapp: '+256770000000',
  telegram: 'https://t.me/roycomix_ug',
  banners: DEFAULT_BANNERS,
  themeColor: 'blue',
  defaultThemeMode: 'light',
  recentImages: [
    'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  ],
};

interface ProductsContextType {
  products: InvestmentProduct[];
  settings: PlatformSettings;
  updateProduct: (product: InvestmentProduct) => Promise<void>;
  addProduct: (product: InvestmentProduct) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<PlatformSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const LOCAL_PRODUCTS_KEY = 'jersey_products_catalog_v3';
const LOCAL_SETTINGS_KEY = 'jersey_platform_settings_v3';
const LOCAL_SEEDED_KEY = 'jersey_products_seeded_v3';

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<InvestmentProduct[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          let valid = true;
          for (const p of parsed) {
            if (!p.id || typeof p.id !== 'string' || p.id.trim() === '' || seenIds.has(p.id)) {
              valid = false;
              break;
            }
            seenIds.add(p.id);
          }
          if (valid) {
            return parsed.map((p: InvestmentProduct) => {
              let tag = p.tag
                ? p.tag
                    .replace(/\bhigh\s*return\b/gi, 'VIP2')
                    .replace(/\bpopular\b/gi, 'VIP1')
                    .replace(/\bhot\s*seller\b/gi, 'VIP4')
                    .replace(/\brecommended\b/gi, 'VIP5')
                : p.tag;
              if (p.id === 'jersey-barca-vvip1') {
                tag = 'VVIP1';
              }
              if (p.id === 'jersey-mancity-vvip2') {
                tag = 'VVIP2';
              }
              return { ...p, tag };
            });
          }
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_PRODUCTS;
  });

  const [settings, setSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Listen to Firestore products collection with auto-seed and full deletion handling
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed to Firestore so all default products are live documents
          setProducts(DEFAULT_PRODUCTS);
          try {
            localStorage.setItem(LOCAL_SEEDED_KEY, 'true');
            localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
          } catch {}
          // Write each default product as an independent doc in Firestore
          for (const prod of DEFAULT_PRODUCTS) {
            try {
              await setDoc(doc(db, 'products', prod.id), prod);
            } catch (err) {
              console.warn('Product seed item note:', err);
            }
          }
        } else {
          // Process live products from Firestore
          const list: InvestmentProduct[] = [];
          const seenIds = new Set<string>();
          snapshot.forEach((d) => {
            const data = d.data() as InvestmentProduct;
            let docId = (d.id || data.id || '').trim();
            if (!docId || seenIds.has(docId)) {
              docId = `jersey-prod-${list.length}-${Date.now()}`;
            }
            seenIds.add(docId);

            const originalTag = data.tag || '';
            let cleanedTag = originalTag
              .replace(/\bhigh\s*return\b/gi, 'VIP2')
              .replace(/\bpopular\b/gi, 'VIP1')
              .replace(/\bhot\s*seller\b/gi, 'VIP4')
              .replace(/\brecommended\b/gi, 'VIP5');
            if (docId === 'jersey-barca-vvip1') {
              cleanedTag = 'VVIP1';
            }
            if (docId === 'jersey-mancity-vvip2') {
              cleanedTag = 'VVIP2';
            }
            if (
              originalTag &&
              (/\bhigh\s*return\b/i.test(originalTag) ||
                /\bpopular\b/i.test(originalTag) ||
                /\bhot\s*seller\b/i.test(originalTag) ||
                /\brecommended\b/i.test(originalTag) ||
                (d.id === 'jersey-mancity-vvip2' && originalTag !== 'VVIP2') ||
                (d.id === 'jersey-barca-vvip1' && originalTag !== 'VVIP1'))
            ) {
              try {
                setDoc(doc(db, 'products', d.id), { tag: cleanedTag }, { merge: true });
              } catch {}
            }
            list.push({
              id: docId,
              name: data.name || 'Jersey Investment Plan',
              category: data.category || 'All',
              tag: cleanedTag,
              shareValueUGX: Number(data.shareValueUGX) || 10000,
              dailyReturnUGX: Number(data.dailyReturnUGX) || 500,
              contractDays: Number(data.contractDays) || 50,
              totalReturnUGX:
                Number(data.totalReturnUGX) ||
                (Number(data.dailyReturnUGX) || 500) * (Number(data.contractDays) || 50),
              limitPerUser: Number(data.limitPerUser) || 5,
              imageUrl:
                typeof data.imageUrl === 'string' && data.imageUrl
                  ? data.imageUrl
                  : 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
              description: data.description || '',
              highlights: Array.isArray(data.highlights) && data.highlights.length > 0 ? data.highlights : ['Automated Yield', 'Fast ROI'],
            });
          });
          setProducts(list);
          localStorage.setItem(LOCAL_SEEDED_KEY, 'true');
          try {
            localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
          } catch {}
        }
      },
      (err) => {
        console.warn('Firestore products snapshot note:', err);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PlatformSettings;
          setSettings((prev) => ({ ...prev, ...data }));
          try {
            localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data));
          } catch {}
        }
      },
      () => {}
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  const updateProduct = async (prod: InvestmentProduct) => {
    // 1. Optimistic update
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === prod.id ? prod : p));
      try {
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    localStorage.setItem(LOCAL_SEEDED_KEY, 'true');

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'products', prod.id), prod, { merge: true });
    } catch (err) {
      console.warn('Firestore product update note:', err);
    }
  };

  const addProduct = async (prod: InvestmentProduct) => {
    const finalProd: InvestmentProduct = {
      ...prod,
      id: prod.id || ('jersey-plan-' + Date.now()),
    };

    // 1. Optimistic add
    setProducts((prev) => {
      const updated = [finalProd, ...prev.filter((p) => p.id !== finalProd.id)];
      try {
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    localStorage.setItem(LOCAL_SEEDED_KEY, 'true');

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'products', finalProd.id), finalProd);
    } catch (err) {
      console.warn('Firestore product add note:', err);
    }
  };

  const deleteProduct = async (productId: string) => {
    // 1. Optimistic removal
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    localStorage.setItem(LOCAL_SEEDED_KEY, 'true');

    // 2. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      console.warn('Firestore product delete note:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<PlatformSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings, { merge: true });
    } catch (err) {
      console.warn('Firestore settings update note:', err);
    }
  };

  const resetToDefaults = async () => {
    setProducts(DEFAULT_PRODUCTS);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(LOCAL_SEEDED_KEY, 'true');
    } catch {}

    // Rewrite all default products to Firestore
    for (const prod of DEFAULT_PRODUCTS) {
      try {
        await setDoc(doc(db, 'products', prod.id), prod);
      } catch (err) {
        console.warn('Firestore reset error:', err);
      }
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        settings,
        updateProduct,
        addProduct,
        deleteProduct,
        updateSettings,
        resetToDefaults,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
