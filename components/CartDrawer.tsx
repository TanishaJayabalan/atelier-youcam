'use client';

import React from 'react';
import { X, ShoppingBag, ExternalLink, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from './CartContext';

export default function CartDrawer() {
  const { cartItems, removeFromCart, clearCart, isCartOpen, setIsCartOpen } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Your Curated Cart</h3>
                <p className="text-xs text-stone-500">Saved items ready for store checkout</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
                <h4 className="font-bold text-stone-700 text-sm">Your Cart is Empty</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Tap "Add to Cart" on any gap-fill recommendation or digital wardrobe item to save it here.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-stone-200 p-3.5 flex gap-3 bg-stone-50/50 hover:border-stone-300 transition-all text-xs"
                >
                  {/* Item Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                          {item.brand}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-semibold text-stone-900 line-clamp-1 mt-0.5">
                        {item.name}
                      </h4>
                      {item.reason && (
                        <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-xs">
                        {item.priceEstimate}
                      </span>
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                      >
                        Shop on Store <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-stone-50/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                <span>Saved Items Count</span>
                <span className="font-bold text-stone-900">{cartItems.length} items</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                ℹ️ Direct checkout is fulfilled externally. Clicking "Shop on Store" opens the retailer site in a new tab.
              </p>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-xs font-semibold text-stone-500 hover:text-stone-700 py-1"
              >
                Clear All Items
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
