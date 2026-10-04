import { useState } from "react";
import { ArrowUpRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { useLang } from "../lib/i18n";

const products = [
  { id: "campaign", price: 48000000, image: "/images/sample-1.jpg" },
  { id: "identity", price: 32000000, image: "/images/sample-2.jpg" },
  { id: "music", price: 56000000, image: "/images/sample-3.jpg" },
];

export default function ShopCalculator({ onContact }: { onContact: () => void }) {
  const { lang, dir, t } = useLang();
  const s = t.shop;
  const currency = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
  const num = (n: number) => (lang === "fa" ? n.toLocaleString("fa-IR") : String(n));

  const [productId, setProductId] = useState(products[0].id);
  const [quantity, setQuantity] = useState(1);
  const [tier, setTier] = useState<"standard" | "expanded">("standard");
  const product = products.find((item) => item.id === productId) ?? products[0];
  const multiplier = tier === "expanded" ? 1.45 : 1;
  const estimate = Math.round(product.price * quantity * multiplier);
  const info = s.products[product.id];

  return <main id="main" className="site-shell three-act standalone-page shop-page" dir={dir}>
    <div className="page-view-inner">
      <header className="page-heading shop-heading">
        <span className="eyebrow">{s.eyebrow}</span>
        <h1>{s.title}<br /><em>{s.titleEm}</em></h1>
        <p>{s.intro}</p>
      </header>
      <div className="shop-layout">
        <section className="product-grid grid gap-4 sm:grid-cols-2 md:grid-cols-3" aria-label={s.packages}>
          {products.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`product-item ${productId === item.id ? "selected" : ""}`}
              onClick={() => setProductId(item.id)}
              aria-pressed={productId === item.id}
            >
              <span className="product-image">
                <img src={item.image} alt="" loading="lazy" decoding="async" />
                <span>0{index + 1} / {s.package}</span>
              </span>
              <span className="product-copy">
                <b>{s.products[item.id].name}</b>
                <small>{s.products[item.id].type}</small>
              </span>
              <span className="product-price">{s.from} {currency.format(item.price)} {s.toman}</span>
            </button>
          ))}
        </section>
        <aside className="price-calculator">
          <span className="eyebrow">{s.quick}</span>
          <h2>{info.name}</h2>
          <label className="tier-select">
            <span>{s.scope}</span>
            <select value={tier} onChange={(event) => setTier(event.target.value as "standard" | "expanded")}>
              <option value="standard">{s.standard}</option>
              <option value="expanded">{s.expanded}</option>
            </select>
          </label>
          <div className="quantity-control">
            <span>{s.deliverables}</span>
            <div>
              <button type="button" aria-label={s.less} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                <Minus size={14} />
              </button>
              <output aria-live="polite">{num(quantity)}</output>
              <button type="button" aria-label={s.more} onClick={() => setQuantity((value) => Math.min(20, value + 1))}>
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="estimate-total">
            <span>{s.total}</span>
            <strong aria-live="polite">{currency.format(estimate)} <small>{s.toman}</small></strong>
          </div>
          <p>{s.note}</p>
          <button className="page-submit" type="button" onClick={onContact}>
            <span>{s.cta}</span>
            <ShoppingBag size={15} />
            <ArrowUpRight size={14} />
          </button>
        </aside>
      </div>
    </div>
  </main>;
}
