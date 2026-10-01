import { useState } from "react";
import { ArrowUpRight, Minus, Plus, ShoppingBag } from "lucide-react";

const products = [
  { id: "campaign", name: "AI Campaign Film", type: "BRAND / 00:30—01:00", price: 48000000, image: "/images/sample-1.jpg" },
  { id: "identity", name: "Visual Identity Kit", type: "IDENTITY / DIGITAL", price: 32000000, image: "/images/sample-2.jpg" },
  { id: "music", name: "Music Video World", type: "MUSIC / 00:20—00:45", price: 56000000, image: "/images/sample-3.jpg" },
];

const currency = new Intl.NumberFormat("fa-IR");

export default function ShopCalculator({ onContact }: { onContact: () => void }) {
  const [productId, setProductId] = useState(products[0].id);
  const [quantity, setQuantity] = useState(1);
  const [tier, setTier] = useState<"standard" | "expanded">("standard");
  const product = products.find((item) => item.id === productId) ?? products[0];
  const multiplier = tier === "expanded" ? 1.45 : 1;
  const estimate = Math.round(product.price * quantity * multiplier);

  return <main className="site-shell three-act standalone-page shop-page">
    <div className="page-view-inner">
      <header className="page-heading shop-heading"><span className="eyebrow">04 / STUDIO SHOP</span><h1>Choose a<br /><em>format.</em></h1><p>Production packages are scoped to your brief. Adjust the estimate, then start a conversation.</p></header>
      <div className="shop-layout">
        {/* Responsive product grid layout */}
        <section className="product-grid grid gap-4 sm:grid-cols-2 md:grid-cols-3" aria-label="Studio packages">
          {products.map((item, index) => (
            <button 
              type="button" 
              key={item.id} 
              className={`product-item ${productId === item.id ? "selected" : ""}`} 
              onClick={() => setProductId(item.id)} 
              aria-pressed={productId === item.id}
            >
              <span className="product-image">
                <img src={item.image} alt="" />
                <span>0{index + 1} / PACKAGE</span>
              </span>
              <span className="product-copy">
                <b>{item.name}</b>
                <small>{item.type}</small>
              </span>
              <span className="product-price">From {currency.format(item.price)} تومان</span>
            </button>
          ))}
        </section>
        <aside className="price-calculator">
          <span className="eyebrow">QUICK ESTIMATE</span>
          <h2>{product.name}</h2>
          <label className="tier-select">
            <span>PRODUCTION SCOPE</span>
            <select 
              value={tier} 
              onChange={(event) => setTier(event.target.value as "standard" | "expanded")}
            >
              <option value="standard">Standard / 1.0×</option>
              <option value="expanded">Expanded / 1.45×</option>
            </select>
          </label>
          <div className="quantity-control">
            <span>DELIVERABLES</span>
            <div>
              <button 
                type="button" 
                aria-label="Decrease quantity"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus size={14} />
              </button>
              <output>{quantity}</output>
              <button 
                type="button" 
                aria-label="Increase quantity"
                onClick={() => setQuantity((value) => Math.min(20, value + 1))}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="estimate-total">
            <span>ESTIMATED TOTAL</span>
            <strong>{currency.format(estimate)} <small>تومان</small></strong>
          </div>
          <p>Final pricing is confirmed after reviewing the production brief.</p>
          <button 
            className="page-submit" 
            type="button"
            onClick={onContact}
          >
            <span>DISCUSS THIS PACKAGE</span>
            <ShoppingBag size={15} />
            <ArrowUpRight size={14} />
          </button>
        </aside>
      </div>
    </div>
  </main>;
}
