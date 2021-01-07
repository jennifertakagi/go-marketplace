import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import formatValue from '../utils/formatValue';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
  cartTotal(): void;
  totalItemsInCart(): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStored = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsStored) setProducts([...JSON.parse(productsStored)]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(prod => prod.id === product.id);

      if (productExists) {
        setProducts(
          products.map(prod =>
            prod.id === product.id
              ? { ...product, quantity: prod.quantity + 1 }
              : prod,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const cartTotal = useMemo(() => {
    const sumCartPrice = products.reduce((total, product) => {
      return product.price ? product.price * product.quantity + total : total;
    }, 0);

    return formatValue(sumCartPrice);
  }, [products]);

  const totalItemsInCart = useMemo(() => {
    const sumCartItems = products.reduce(
      (total, product) => (product.quantity ? product.quantity + total : total),
      0,
    );

    return sumCartItems;
  }, [products]);

  const value = useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      cartTotal,
      totalItemsInCart,
    }),
    [products, addToCart, increment, decrement, cartTotal, totalItemsInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
