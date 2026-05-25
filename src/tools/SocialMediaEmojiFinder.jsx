import { useMemo, useState } from "react";
import {
  Search,
  Copy,
  CheckCircle,
  AlertCircle,
  Smile,
  ShoppingBag,
  Tags,
  Truck,
  Star,
  Gift,
  Megaphone,
  Trash2,
  X,
  Sparkles,
  Heart,
  Zap,
  RotateCcw,
  Clipboard,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Social Media Emoji Finder",
  path: "/social-media-emoji-finder",
  category: "Social Media Tools",
  description:
    "Find and copy the best emojis for ecommerce posts, sales captions, product promotions, delivery updates, reviews, and social media marketing.",
  metaTitle:
    "Social Media Emoji Finder | Copy Emojis for Ecommerce Posts",
  metaDescription:
    "Search, find, collect, and copy emojis for ecommerce posts, Instagram captions, Facebook posts, product promotions, sales campaigns, delivery updates, reviews, and call-to-action content.",
};

const EMOJI_CATEGORIES = [
  {
    id: "sales",
    name: "Sales & Offers",
    description: "Discounts, deals, flash sales, coupons, and promos.",
    emojis: [
      emojiItem("🔥", "Hot Sale", ["sale", "hot", "discount", "trending", "offer"]),
      emojiItem("💸", "Money Saving", ["money", "saving", "discount", "cheap", "deal"]),
      emojiItem("🏷️", "Price Tag", ["price", "tag", "discount", "coupon", "offer"]),
      emojiItem("🎉", "Big Offer", ["offer", "celebration", "sale", "campaign"]),
      emojiItem("⚡", "Flash Deal", ["flash", "fast", "deal", "limited", "quick"]),
      emojiItem("💥", "Mega Sale", ["mega", "sale", "boom", "offer", "discount"]),
      emojiItem("🛒", "Shopping Cart", ["shop", "cart", "buy", "order"]),
      emojiItem("🎯", "Best Deal", ["target", "deal", "best", "offer"]),
      emojiItem("💰", "Save Money", ["money", "save", "price", "deal"]),
      emojiItem("🤑", "Great Price", ["price", "money", "saving", "deal"]),
    ],
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Fresh products, launches, drops, and new collections.",
    emojis: [
      emojiItem("🆕", "New", ["new", "arrival", "latest", "fresh"]),
      emojiItem("✨", "Fresh Drop", ["new", "sparkle", "fresh", "premium"]),
      emojiItem("📦", "New Stock", ["stock", "package", "product", "arrival"]),
      emojiItem("👀", "Sneak Peek", ["look", "see", "preview", "launch"]),
      emojiItem("🌟", "Featured", ["featured", "new", "star", "highlight"]),
      emojiItem("🔔", "Announcement", ["announce", "new", "alert", "notify"]),
      emojiItem("🚀", "Launch", ["launch", "new", "start", "release"]),
      emojiItem("🛍️", "New Collection", ["shopping", "collection", "store", "arrival"]),
    ],
  },
  {
    id: "fashion",
    name: "Fashion & Clothing",
    description: "Clothing, outfits, shoes, bags, and style posts.",
    emojis: [
      emojiItem("👗", "Dress", ["dress", "fashion", "women", "style"]),
      emojiItem("👕", "T-Shirt", ["shirt", "fashion", "clothing", "casual"]),
      emojiItem("👚", "Blouse", ["blouse", "fashion", "women", "top"]),
      emojiItem("👠", "Heels", ["heels", "shoes", "fashion", "women"]),
      emojiItem("👜", "Handbag", ["bag", "handbag", "purse", "fashion"]),
      emojiItem("🧥", "Jacket", ["jacket", "coat", "winter", "fashion"]),
      emojiItem("🧢", "Cap", ["cap", "hat", "fashion", "streetwear"]),
      emojiItem("👟", "Sneakers", ["sneakers", "shoes", "sports", "fashion"]),
      emojiItem("⌚", "Watch", ["watch", "accessory", "style", "fashion"]),
      emojiItem("🕶️", "Sunglasses", ["sunglasses", "style", "summer", "fashion"]),
    ],
  },
  {
    id: "beauty",
    name: "Beauty & Skincare",
    description: "Cosmetics, skincare, makeup, salon, and self-care content.",
    emojis: [
      emojiItem("💄", "Lipstick", ["makeup", "lipstick", "beauty", "cosmetic"]),
      emojiItem("💅", "Nails", ["nail", "salon", "beauty", "manicure"]),
      emojiItem("✨", "Glow", ["glow", "beauty", "shine", "skincare"]),
      emojiItem("🌸", "Soft Beauty", ["flower", "beauty", "soft", "feminine"]),
      emojiItem("🧴", "Skincare", ["skincare", "cream", "lotion", "beauty"]),
      emojiItem("💖", "Pretty", ["pretty", "love", "beauty", "pink"]),
      emojiItem("👑", "Queen", ["premium", "beauty", "queen", "luxury"]),
      emojiItem("🪞", "Mirror", ["mirror", "beauty", "makeup", "look"]),
      emojiItem("🫧", "Clean Care", ["clean", "fresh", "skincare", "soap"]),
      emojiItem("🌿", "Natural Beauty", ["natural", "organic", "herbal", "skincare"]),
    ],
  },
  {
    id: "food",
    name: "Food & Restaurant",
    description: "Restaurants, cafes, food delivery, and menu posts.",
    emojis: [
      emojiItem("🍔", "Burger", ["burger", "food", "restaurant", "fast food"]),
      emojiItem("🍕", "Pizza", ["pizza", "food", "restaurant", "delivery"]),
      emojiItem("🍟", "Fries", ["fries", "fast food", "snack", "restaurant"]),
      emojiItem("🍰", "Cake", ["cake", "dessert", "sweet", "bakery"]),
      emojiItem("☕", "Coffee", ["coffee", "cafe", "drink", "beverage"]),
      emojiItem("🍽️", "Meal", ["meal", "food", "restaurant", "dining"]),
      emojiItem("😋", "Tasty", ["tasty", "delicious", "food", "yum"]),
      emojiItem("🥤", "Drink", ["drink", "juice", "beverage", "cold"]),
      emojiItem("🥗", "Healthy Food", ["healthy", "salad", "food", "fresh"]),
      emojiItem("🍗", "Chicken", ["chicken", "food", "restaurant", "meal"]),
    ],
  },
  {
    id: "home",
    name: "Home & Decor",
    description: "Interior, furniture, home decor, and lifestyle products.",
    emojis: [
      emojiItem("🏡", "Home", ["home", "house", "decor", "lifestyle"]),
      emojiItem("🛋️", "Sofa", ["sofa", "furniture", "decor", "living room"]),
      emojiItem("🕯️", "Candle", ["candle", "decor", "home", "cozy"]),
      emojiItem("🖼️", "Wall Art", ["art", "frame", "decor", "wall"]),
      emojiItem("🌿", "Plant Decor", ["plant", "green", "decor", "natural"]),
      emojiItem("🛏️", "Bedroom", ["bed", "bedroom", "home", "comfort"]),
      emojiItem("🧺", "Home Basket", ["basket", "home", "storage", "decor"]),
      emojiItem("✨", "Beautiful Home", ["home", "beautiful", "sparkle", "decor"]),
    ],
  },
  {
    id: "gifts",
    name: "Gifts & Occasions",
    description: "Birthday, wedding, anniversary, holiday, and gift posts.",
    emojis: [
      emojiItem("🎁", "Gift", ["gift", "present", "birthday", "occasion"]),
      emojiItem("💝", "Special Gift", ["gift", "love", "special", "occasion"]),
      emojiItem("🎉", "Party", ["party", "celebration", "birthday", "event"]),
      emojiItem("🎂", "Birthday", ["birthday", "cake", "party", "gift"]),
      emojiItem("💐", "Bouquet", ["flower", "gift", "wedding", "occasion"]),
      emojiItem("❤️", "Love", ["love", "heart", "valentine", "romantic"]),
      emojiItem("🥳", "Celebrate", ["celebrate", "party", "happy", "occasion"]),
      emojiItem("💍", "Wedding", ["wedding", "ring", "engagement", "bridal"]),
      emojiItem("🎈", "Balloon", ["balloon", "birthday", "party", "event"]),
      emojiItem("🌹", "Rose", ["rose", "flower", "love", "gift"]),
    ],
  },
  {
    id: "luxury",
    name: "Luxury & Premium",
    description: "Premium, elegant, high-end, and exclusive product posts.",
    emojis: [
      emojiItem("👑", "Premium", ["premium", "luxury", "king", "queen"]),
      emojiItem("💎", "Luxury", ["diamond", "luxury", "premium", "exclusive"]),
      emojiItem("✨", "Elegant", ["elegant", "shine", "premium", "sparkle"]),
      emojiItem("🖤", "Black Luxury", ["black", "luxury", "premium", "elegant"]),
      emojiItem("🥂", "Exclusive", ["exclusive", "premium", "celebration", "luxury"]),
      emojiItem("🌟", "Top Quality", ["star", "top", "premium", "quality"]),
      emojiItem("🏆", "Award Winning", ["award", "best", "winner", "premium"]),
      emojiItem("💫", "Special Touch", ["special", "magic", "premium", "shine"]),
    ],
  },
  {
    id: "trust",
    name: "Trust & Quality",
    description: "Original products, warranty, verified seller, and quality.",
    emojis: [
      emojiItem("✅", "Verified", ["verified", "check", "quality", "trust"]),
      emojiItem("⭐", "Quality", ["quality", "star", "rating", "best"]),
      emojiItem("🛡️", "Protected", ["safe", "secure", "warranty", "trust"]),
      emojiItem("💯", "100 Percent", ["100", "perfect", "quality", "trust"]),
      emojiItem("🏆", "Best Quality", ["best", "award", "winner", "quality"]),
      emojiItem("👍", "Recommended", ["good", "like", "recommended", "trust"]),
      emojiItem("🔒", "Secure", ["secure", "safe", "payment", "trust"]),
      emojiItem("📜", "Warranty", ["warranty", "certificate", "guarantee", "trust"]),
    ],
  },
  {
    id: "reviews",
    name: "Reviews & Feedback",
    description: "Testimonials, happy customers, ratings, and social proof.",
    emojis: [
      emojiItem("⭐", "Star Review", ["review", "star", "rating", "feedback"]),
      emojiItem("🌟", "Five Star", ["five star", "rating", "review", "feedback"]),
      emojiItem("💬", "Customer Says", ["comment", "review", "feedback", "message"]),
      emojiItem("❤️", "Loved It", ["love", "customer", "review", "happy"]),
      emojiItem("🙌", "Happy Customer", ["happy", "customer", "support", "review"]),
      emojiItem("🥰", "Satisfied", ["satisfied", "love", "happy", "review"]),
      emojiItem("😊", "Happy Face", ["happy", "smile", "customer", "feedback"]),
      emojiItem("📸", "Customer Photo", ["photo", "customer", "review", "ugc"]),
    ],
  },
  {
    id: "delivery",
    name: "Delivery & Shipping",
    description: "Shipping, courier, parcel, pickup, and order updates.",
    emojis: [
      emojiItem("🚚", "Delivery Truck", ["delivery", "shipping", "truck", "courier"]),
      emojiItem("📦", "Package", ["package", "parcel", "order", "box"]),
      emojiItem("🛵", "Fast Delivery", ["bike", "delivery", "fast", "courier"]),
      emojiItem("✈️", "Worldwide Shipping", ["worldwide", "shipping", "flight", "international"]),
      emojiItem("🏠", "Home Delivery", ["home", "delivery", "doorstep", "address"]),
      emojiItem("✅", "Delivered", ["delivered", "done", "received", "check"]),
      emojiItem("📍", "Location", ["location", "address", "delivery", "map"]),
      emojiItem("⏱️", "Quick Delivery", ["quick", "fast", "time", "delivery"]),
    ],
  },
  {
    id: "payment",
    name: "Payment & Checkout",
    description: "Checkout, payment, order confirmation, and secure purchase.",
    emojis: [
      emojiItem("💳", "Card Payment", ["card", "payment", "checkout", "pay"]),
      emojiItem("🛒", "Cart", ["cart", "checkout", "shopping", "buy"]),
      emojiItem("🧾", "Invoice", ["invoice", "receipt", "bill", "order"]),
      emojiItem("💰", "Cash", ["cash", "money", "payment", "price"]),
      emojiItem("✅", "Payment Done", ["paid", "done", "payment", "confirmed"]),
      emojiItem("🔐", "Secure Payment", ["secure", "safe", "payment", "lock"]),
      emojiItem("📲", "Mobile Payment", ["mobile", "phone", "payment", "order"]),
      emojiItem("🏦", "Bank", ["bank", "transfer", "payment", "account"]),
    ],
  },
  {
    id: "cta",
    name: "Call to Action",
    description: "Shop now, order now, click, DM, comment, and link prompts.",
    emojis: [
      emojiItem("👇", "Tap Below", ["tap", "below", "click", "cta"]),
      emojiItem("👉", "Point Right", ["right", "click", "link", "cta"]),
      emojiItem("📩", "DM Us", ["dm", "message", "inbox", "contact"]),
      emojiItem("🔗", "Link", ["link", "website", "click", "url"]),
      emojiItem("🛒", "Shop Now", ["shop", "buy", "cart", "order"]),
      emojiItem("✅", "Order Now", ["order", "confirm", "done", "cta"]),
      emojiItem("📲", "Message Now", ["phone", "contact", "message", "mobile"]),
      emojiItem("💬", "Comment", ["comment", "reply", "message", "engage"]),
      emojiItem("📞", "Call Now", ["call", "phone", "contact", "cta"]),
      emojiItem("⬇️", "See Below", ["down", "below", "tap", "cta"]),
    ],
  },
  {
    id: "urgency",
    name: "Urgency & Stock",
    description: "Limited stock, countdown, urgent offers, and scarcity.",
    emojis: [
      emojiItem("⏰", "Limited Time", ["limited", "time", "deadline", "urgent"]),
      emojiItem("⚡", "Fast Action", ["fast", "quick", "urgent", "flash"]),
      emojiItem("🔥", "Hot Demand", ["hot", "trending", "demand", "urgent"]),
      emojiItem("🚨", "Alert", ["alert", "urgent", "warning", "notice"]),
      emojiItem("⌛", "Almost Over", ["time", "ending", "deadline", "limited"]),
      emojiItem("📢", "Announcement", ["announce", "alert", "notice", "campaign"]),
      emojiItem("🔔", "Reminder", ["reminder", "notify", "alert", "urgent"]),
      emojiItem("📉", "Low Stock", ["low", "stock", "limited", "scarcity"]),
    ],
  },
  {
    id: "celebration",
    name: "Celebration & Festival",
    description: "Festival campaigns, greetings, events, and happy moments.",
    emojis: [
      emojiItem("🎉", "Celebration", ["celebration", "party", "happy", "festival"]),
      emojiItem("🥳", "Party Face", ["party", "celebrate", "happy", "event"]),
      emojiItem("🎊", "Confetti", ["confetti", "event", "party", "festival"]),
      emojiItem("🎈", "Balloon", ["balloon", "birthday", "celebration", "event"]),
      emojiItem("✨", "Sparkle", ["sparkle", "shine", "festival", "celebration"]),
      emojiItem("🎆", "Fireworks", ["fireworks", "festival", "celebration", "night"]),
      emojiItem("🌙", "Moon", ["eid", "ramadan", "night", "festival"]),
      emojiItem("🕌", "Festival", ["eid", "ramadan", "mosque", "festival"]),
    ],
  },
];

const POPULAR_COMBOS = [
  {
    title: "Big Sale",
    text: "🔥 Big Sale Alert! 🛍️💸",
    keywords: "sale discount offer ecommerce campaign",
  },
  {
    title: "New Arrival",
    text: "🆕 New Arrival Just Dropped! ✨📦",
    keywords: "new arrival product launch",
  },
  {
    title: "Free Delivery",
    text: "🚚 Free Delivery Available! 📦✅",
    keywords: "delivery shipping courier free delivery",
  },
  {
    title: "Limited Stock",
    text: "⚡ Limited Stock Only! ⏰🔥",
    keywords: "limited stock urgency scarcity",
  },
  {
    title: "Shop Now",
    text: "🛒 Shop Now Before It’s Gone! 👇✨",
    keywords: "shop now buy cta ecommerce",
  },
  {
    title: "Customer Review",
    text: "⭐ Happy Customer Review! 💬❤️",
    keywords: "review testimonial feedback customer",
  },
  {
    title: "Premium Product",
    text: "💎 Premium Quality You’ll Love ✨👑",
    keywords: "premium luxury quality product",
  },
  {
    title: "Gift Idea",
    text: "🎁 Perfect Gift for Someone Special 💝✨",
    keywords: "gift occasion birthday wedding",
  },
];

const CATEGORY_ICONS = {
  all: Smile,
  sales: Tags,
  "new-arrivals": Sparkles,
  fashion: ShoppingBag,
  beauty: Heart,
  food: Smile,
  home: Sparkles,
  gifts: Gift,
  luxury: Star,
  trust: CheckCircle,
  reviews: Star,
  delivery: Truck,
  payment: Clipboard,
  cta: Megaphone,
  urgency: Zap,
  celebration: Gift,
};

export default function SocialMediaEmojiFinder() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [copiedMessage, setCopiedMessage] = useState("");
  const [error, setError] = useState("");

  const allEmojis = useMemo(() => {
    return EMOJI_CATEGORIES.flatMap((category) =>
      category.emojis.map((item, index) => ({
        ...item,
        id: `${category.id}-${item.emoji}-${index}`,
        categoryId: category.id,
        categoryName: category.name,
      }))
    );
  }, []);

  const activeCategoryData = useMemo(() => {
    return EMOJI_CATEGORIES.find((category) => category.id === activeCategory);
  }, [activeCategory]);

  const filteredEmojis = useMemo(() => {
    const cleanQuery = normalizeText(query);

    return allEmojis.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory;

      if (!matchesCategory) return false;

      if (!cleanQuery) return true;

      const searchableText = normalizeText(
        [
          item.emoji,
          item.label,
          item.categoryName,
          ...(item.keywords || []),
        ].join(" ")
      );

      return searchableText.includes(cleanQuery);
    });
  }, [allEmojis, activeCategory, query]);

  const filteredCombos = useMemo(() => {
    const cleanQuery = normalizeText(query);

    if (!cleanQuery) return POPULAR_COMBOS;

    return POPULAR_COMBOS.filter((combo) => {
      const searchableText = normalizeText(
        `${combo.title} ${combo.text} ${combo.keywords}`
      );

      return searchableText.includes(cleanQuery);
    });
  }, [query]);

  const selectedText = selectedEmojis.join(" ");
  const visibleEmojiText = filteredEmojis.map((item) => item.emoji).join(" ");

  async function handleCopy(text, label = "Copied") {
    setError("");

    if (!text.trim()) {
      setError("Nothing to copy yet.");
      return;
    }

    try {
      await copyToClipboard(text);
      setCopiedMessage(label);

      window.setTimeout(() => {
        setCopiedMessage("");
      }, 1600);
    } catch {
      setError("Copy failed. Please copy manually from your browser.");
    }
  }

  function handleEmojiSelect(item) {
    setSelectedEmojis((current) => {
      if (current.includes(item.emoji)) {
        return current;
      }

      return [...current, item.emoji];
    });
  }

  function handleEmojiRemove(emojiToRemove) {
    setSelectedEmojis((current) =>
      current.filter((emoji) => emoji !== emojiToRemove)
    );
  }

  function clearSelectedEmojis() {
    setSelectedEmojis([]);
    setError("");
    setCopiedMessage("");
  }

  function resetTool() {
    setQuery("");
    setActiveCategory("all");
    setSelectedEmojis([]);
    setCopiedMessage("");
    setError("");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Smile size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Social Media Emoji Finder
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Search, collect, and copy the best emojis for ecommerce posts, sales
          captions, product promotions, delivery updates, reviews, and social
          media marketing.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        {/* SEARCH */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search emojis for sale, delivery, beauty, gift, review, shop now..."
            className="w-full rounded-2xl border border-[var(--border)] bg-white py-4 pl-12 pr-4 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[#f4edff]"
          />
        </div>

        {/* FEEDBACK */}
        {copiedMessage && (
          <div className="mt-4 flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <p>{copiedMessage}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* CATEGORY FILTERS */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold">Emoji Categories</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Choose a business-focused category or search directly.
              </p>
            </div>

            <button
              type="button"
              onClick={resetTool}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryButton
              label="All"
              count={allEmojis.length}
              icon={CATEGORY_ICONS.all}
              isActive={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />

            {EMOJI_CATEGORIES.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.name}
                count={category.emojis.length}
                icon={CATEGORY_ICONS[category.id] || Smile}
                isActive={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </div>

        {/* SELECTED EMOJI TRAY */}
        <div className="mt-6 bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-semibold">Selected Emojis</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Click “Add” on emojis to build a quick emoji set for your post.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  handleCopy(selectedText, "Selected emojis copied!")
                }
                disabled={!selectedEmojis.length}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !selectedEmojis.length ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Copy size={16} />
                Copy Selected
              </button>

              <button
                type="button"
                onClick={clearSelectedEmojis}
                disabled={!selectedEmojis.length}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !selectedEmojis.length ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>

          {selectedEmojis.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiRemove(emoji)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-[var(--border)] px-3 py-2 text-xl hover:border-red-200 hover:bg-red-50 transition"
                  title="Remove emoji"
                >
                  <span>{emoji}</span>
                  <X size={14} className="text-[var(--text-secondary)]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-white border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
              No emojis selected yet. Add emojis from the results below.
            </div>
          )}
        </div>

        {/* RESULTS HEADER */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="font-semibold">
              {activeCategory === "all"
                ? "Emoji Results"
                : activeCategoryData?.name || "Emoji Results"}
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              {filteredEmojis.length} emoji
              {filteredEmojis.length === 1 ? "" : "s"} found
              {query ? ` for “${query}”` : ""}.
            </p>

            {activeCategoryData?.description && activeCategory !== "all" && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {activeCategoryData.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              handleCopy(visibleEmojiText, "All visible emojis copied!")
            }
            disabled={!filteredEmojis.length}
            className={`btn-secondary inline-flex items-center justify-center gap-2 ${
              !filteredEmojis.length ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Copy size={16} />
            Copy All Results
          </button>
        </div>

        {/* EMOJI GRID */}
        {filteredEmojis.length > 0 ? (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmojis.map((item) => (
              <EmojiCard
                key={item.id}
                item={item}
                isSelected={selectedEmojis.includes(item.emoji)}
                onCopy={() =>
                  handleCopy(item.emoji, `${item.emoji} copied!`)
                }
                onSelect={() => handleEmojiSelect(item)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 text-center py-10 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
            <Search size={42} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold mb-2">No emojis found</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Try searching with words like sale, discount, delivery, beauty,
              gift, review, luxury, payment, or shop now.
            </p>
          </div>
        )}

        {/* POPULAR COMBOS */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-[var(--primary)]" />
            <h2 className="font-semibold">Popular Ecommerce Emoji Combos</h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredCombos.map((combo) => (
              <div
                key={combo.title}
                className="border border-[var(--border)] rounded-2xl bg-white p-4"
              >
                <p className="font-semibold text-sm mb-2">{combo.title}</p>

                <div className="rounded-xl bg-[#f8f4ff] border border-[var(--border)] p-4 text-center text-lg font-semibold">
                  {combo.text}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(combo.text, `${combo.title} combo copied!`)
                  }
                  className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copy Combo
                </button>
              </div>
            ))}
          </div>

          {filteredCombos.length === 0 && (
            <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
              <p className="text-sm text-[var(--text-secondary)]">
                No matching combos found for your search.
              </p>
            </div>
          )}
        </div>

        {/* SAFE NOTE */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-900 mb-2">
            Simple and safe emoji copying
          </h3>
          <p className="text-sm text-blue-800">
            This tool uses normal Unicode emoji characters only. It does not use
            paid APIs, upload files, or store user data.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="social-media-emoji-finder" />
    </div>
  );
}

function CategoryButton({ label, count, icon: Icon, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
        isActive
          ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          isActive
            ? "bg-white text-[var(--primary)]"
            : "bg-gray-100 text-[var(--text-secondary)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmojiCard({ item, isSelected, onCopy, onSelect }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl bg-white p-4 hover:shadow-sm transition">
      <button
        type="button"
        onClick={onCopy}
        className="w-full rounded-xl bg-[#f8f4ff] border border-[var(--border)] p-5 text-center hover:border-[var(--primary)] transition"
        title={`Copy ${item.label}`}
      >
        <div className="text-4xl mb-2">{item.emoji}</div>
        <p className="font-semibold text-sm">{item.label}</p>
      </button>

      <div className="mt-3">
        <p className="text-xs text-[var(--text-secondary)] mb-2">
          {item.categoryName}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 text-sm"
          >
            <Copy size={14} />
            Copy
          </button>

          <button
            type="button"
            onClick={onSelect}
            disabled={isSelected}
            className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 text-sm ${
              isSelected ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <CheckCircle size={14} />
            {isSelected ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function emojiItem(emoji, label, keywords = []) {
  return {
    emoji,
    label,
    keywords,
  };
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}