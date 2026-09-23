import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export interface CartItem {
  articleId: number;
  nom: string;
  prix: number;
  unite: string;
  photo: string | null;
  projetId: number;
  projetLibelle: string;
  pointRetrait: string;
  quantite: number;
  stock: number | null;
}

export interface GrowzMarketCartContextType {
  items: CartItem[];
  addItem: (
    article: Omit<CartItem, "quantite">,
    quantite: number,
  ) => void;
  removeItem: (articleId: number) => void;
  updateQuantite: (articleId: number, quantite: number) => void;
  clearCart: () => void;
  clearVendorItems: (projetId: number) => void;
  totalItems: number;
}

const STORAGE_KEY = "growzmarket_cart";

const GrowzMarketCartContext = createContext<GrowzMarketCartContextType | undefined>(undefined);

export function GrowzMarketCartProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: GrowzMarketCartContextType["addItem"] = (article, quantite) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.articleId === article.articleId);
      const maxStock = article.stock;

      if (existing) {
        let newQte = existing.quantite + quantite;
        if (maxStock !== null && newQte > maxStock) {
          newQte = maxStock;
          toast.error(
            t("growzmarket.cart.toast_stock_max", "Quantité limitée au stock disponible ({{count}})", {
              count: maxStock,
            }),
          );
        }
        return prev.map((i) =>
          i.articleId === article.articleId ? { ...i, quantite: newQte } : i,
        );
      }

      let qte = quantite;
      if (maxStock !== null && qte > maxStock) {
        qte = maxStock;
        toast.error(
          t("growzmarket.cart.toast_stock_max", "Quantité limitée au stock disponible ({{count}})", {
            count: maxStock,
          }),
        );
      }
      toast.success(t("growzmarket.cart.toast_added", "Ajouté au panier"));
      return [...prev, { ...article, quantite: qte }];
    });
  };

  const removeItem = (articleId: number) => {
    setItems((prev) => prev.filter((i) => i.articleId !== articleId));
  };

  const updateQuantite = (articleId: number, quantite: number) => {
    setItems((prev) => {
      if (quantite <= 0) return prev.filter((i) => i.articleId !== articleId);
      return prev.map((i) => {
        if (i.articleId !== articleId) return i;
        const capped = i.stock !== null ? Math.min(quantite, i.stock) : quantite;
        return { ...i, quantite: capped };
      });
    });
  };

  const clearCart = () => setItems([]);

  const clearVendorItems = (projetId: number) => {
    setItems((prev) => prev.filter((i) => i.projetId !== projetId));
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantite, 0);

  return (
    <GrowzMarketCartContext.Provider
      value={{ items, addItem, removeItem, updateQuantite, clearCart, clearVendorItems, totalItems }}
    >
      {children}
    </GrowzMarketCartContext.Provider>
  );
}

export const useGrowzMarketCart = (): GrowzMarketCartContextType => {
  const context = useContext(GrowzMarketCartContext);
  if (!context) {
    throw new Error("useGrowzMarketCart doit être utilisé dans un GrowzMarketCartProvider");
  }
  return context;
};
