import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

const THEMES = {
  dark: { bg: "#070A09", bg2: "#0D1511", card: "rgba(255,255,255,.055)", hair: "rgba(255,255,255,.09)", text: "#F5F7F4", soft: "#B8C1BB", dim: "#758078", green: "#37B878", deep: "#145B3A", mint: "#70E0A8", pink: "#F08BB4", gold: "#F1C15D", outer: "#000" },
  light: { bg: "#FFF5F8", bg2: "#FBE6EE", card: "rgba(95,30,55,.055)", hair: "rgba(95,30,55,.12)", text: "#351A24", soft: "#7D5361", dim: "#B38F9B", green: "#247A55", deep: "#174D37", mint: "#49AE79", pink: "#E779A5", gold: "#B47B18", outer: "#F1DCE4" },
};

// هر کاسمتیک تم یه جفت رنگ اصلی (accent/deep) داره که وقتی equip میشه،
// جایگزین رنگ green/deep پیش‌فرض در سراسر اپ (باب‌بار، حباب پیام خودم، دکمه‌ها و...) میشه.
const COSMETIC_THEMES = [
  { name: "Aurora Nights", grad: "linear-gradient(135deg,#142E27,#7B3E67)", cost: 110, accent: "#3EDBA8", accentDeep: "#174B3C" },
  { name: "Pink Cloud", grad: "linear-gradient(135deg,#FFB7D0,#8B5A87)", cost: 110, accent: "#F08BB4", accentDeep: "#8B3E64" },
  { name: "Void Bloom", grad: "linear-gradient(135deg,#080A16,#28305D)", cost: 110, accent: "#6E7BFF", accentDeep: "#282C6B" },
  { name: "Golden Night", grad: "linear-gradient(135deg,#352514,#D39B38)", cost: 110, accent: "#F1C15D", accentDeep: "#7A5518" },
];

const ME = { name: "XZEOUS", handle: "@xzeous", id: "XS-7F29A", bio: "بنیان‌گذار XZEOUS · Vex", birthday: "08-22" };

const BADGES = [
  ["👑", "Founder", "بنیان‌گذار XZEOUS", "#F1C15D"],
  ["💎", "Premium", "عضویت Premium فعال", "#78D7FF"],
  ["🐱", "Cat Lover", "کلکسیون گربه‌ها", "#F08BB4"],
  ["⚡", "Early", "از کاربران اولیه", "#B48CFF"],
  ["🎁", "Gifted", "ارسال اولین گیفت", "#7CE0A8"],
  ["🏆", "Collector", "کلکسیونر حرفه‌ای", "#FF9F6B"],
];

const GIFTS = [
  { id: 1, name: "رز شبانه", icon: "🌹", price: 100, rarity: "Common", glow: "#F17A9E" },
  { id: 2, name: "تاج کوچک", icon: "👑", price: 800, rarity: "Epic", glow: "#F1C15D" },
  { id: 3, name: "الماس گربه", icon: "💎", price: 2000, rarity: "Legendary", glow: "#78D7FF" },
  { id: 4, name: "ماه صورتی", icon: "🌙", price: 1400, rarity: "Epic", glow: "#E89CFF" },
  { id: 5, name: "ستاره", icon: "⭐", price: 500, rarity: "Rare", glow: "#FFE27A" },
  { id: 6, name: "قلب ژله‌ای", icon: "💗", price: 350, rarity: "Rare", glow: "#FF8DBB" },
  { id: 7, name: "خرس تدی", icon: "🧸", price: 450, rarity: "Rare", glow: "#F1B37A" },
  { id: 8, name: "چاقو", icon: "🔪", price: 200, rarity: "Rare", glow: "#C9D4DA" },
];

// استیکرهای اختصاصی XZEOUS — بعضی رایگان، بعضی خریدنی از Store
const STICKERS = [
  { id: "s1", name: "سلام گرم", icon: "👋", free: true },
  { id: "s2", name: "خنده", icon: "🤣", free: true },
  { id: "s3", name: "قلب سبز", icon: "💚", free: true },
  { id: "s4", name: "پارتی", icon: "🥳", free: false, cost: 60 },
  { id: "s5", name: "گربه ناز", icon: "😽", free: false, cost: 80 },
  { id: "s6", name: "بوس", icon: "😘", free: false, cost: 60 },
  { id: "s7", name: "تاج طلایی", icon: "👑", free: false, cost: 150 },
  { id: "s8", name: "شعله", icon: "🔥", free: false, cost: 90 },
];

// رتبه VIP بر اساس مدت عضویت Premium پیوسته (ماه)
const VIP_TIERS = [
  { id: "none", min: 0, label: "", color: null },
  { id: "bronze", min: 1, label: "VIP برنزی", color: "#C97A45" },
  { id: "silver", min: 4, label: "VIP نقره‌ای", color: "#C7D2DA" },
  { id: "gold", min: 9, label: "VIP طلایی", color: "#F1C15D" },
];
function getVipTier(months) {
  let cur = VIP_TIERS[0];
  for (const tier of VIP_TIERS) if (months >= tier.min) cur = tier;
  return cur;
}

// جعبه شانس روزانه — هر ردیف مستقل بررسی میشه (ممکنه چند جایزه با هم بیفته)
const LOOTBOX_TABLE = [
  { id: "theme", chance: 0.67, label: "یک تم رندوم", icon: "🎨" },
  { id: "coin20", chance: 0.50, label: "۲۰ زئوس کوین", icon: "🪙", coins: 20 },
  { id: "coin19", chance: 0.40, label: "۱۹ زئوس کوین", icon: "🪙", coins: 19 },
  { id: "coin34", chance: 0.35, label: "۳۴ زئوس کوین", icon: "🪙", coins: 34 },
  { id: "knife", chance: 0.10, label: "گیفت چاقو 🔪", icon: "🔪" },
  { id: "teddy", chance: 0.03, label: "گیفت خرس تدی 🧸", icon: "🧸" },
  { id: "premium1m", chance: 0.01, label: "پرمیوم یک ماهه 👑", icon: "👑" },
];

// پروفایل نمونه مخاطب‌ها و کانال — وقتی روی اسم طرف تو چت بزنیم اینا لود میشه
const MEMBER_PROFILES = {
  Nika: {
    name: "Nika", handle: "@nika", id: "XS-441BC", icon: "🐰", bio: "طراح UI/UX · عاشق جزئیات کوچیک", premium: true,
    followers: "1.1K", badges: ["💎", "🐱"], gifts: GIFTS.slice(2, 5),
  },
};
const CHANNEL_PROFILES = {
  "XZEOUS Community": {
    name: "XZEOUS Community", handle: "@xzeouscommunity", id: "CH-XZ001", icon: "👑",
    desc: "کانال رسمی XZEOUS · اخبار، آپدیت‌ها و گیفت‌های محدود", members: 6770, verified: true,
  },
};

const COIN_PACKS = [
  { coins: 100, toman: 20000 },
  { coins: 500, toman: 67000 },
  { coins: 1150, toman: 125000 },
  { coins: 3200, toman: 220000 },
  { coins: 5000, toman: 350000 },
  { coins: 11000, toman: 599000 },
];

const PREMIUM_PLANS = [
  { id: "1m", label: "۱ ماهه", coins: 1000, features: ["رینگ و بج Premium", "دسترسی به گیفت‌های ویژه"] },
  { id: "6m", label: "۶ ماهه", coins: 3500, features: ["همه امکانات ۱ ماهه", "۲ تم اختصاصی رایگان"], tag: "محبوب" },
  { id: "1y", label: "۱ ساله", coins: 5000, features: ["همه امکانات ۶ ماهه", "ریاکشن اختصاصی طلایی ⭐", "اولویت پشتیبانی"], tag: "بهترین ارزش" },
];

const MISSIONS = [
  { id: "login", icon: "📅", title: "ورود روزانه", desc: "هر روز وارد اپ شو", reward: 50 },
  { id: "send3", icon: "💬", title: "ارسال ۳ پیام", desc: "با دوستات چت کن", reward: 30 },
  { id: "gift", icon: "🎁", title: "ارسال یک گیفت", desc: "یه گیفت به کسی بده", reward: 40 },
  { id: "invite", icon: "🧑‍🤝‍🧑", title: "دعوت یک دوست", desc: "لینک دعوتت رو بفرست", reward: 100 },
];

const LEADERBOARD = [
  { name: "ROXY", icon: "🦊", sent: 340, received: 410, premium: true },
  { name: "Nika", icon: "🐰", sent: 300, received: 265, premium: true },
  { name: ME.name, icon: "XZ", sent: 180, received: 210, premium: false },
  { name: "Mahan", icon: "🎮", sent: 150, received: 140, premium: false },
  { name: "Sara", icon: "🌸", sent: 120, received: 160, premium: false },
].sort((a, b) => (b.sent + b.received) - (a.sent + a.received));

const TABS = [["💬", "Chats"], ["🛍️", "Store"], ["🔄", "Market"], ["👤", "Profile"], ["⚙️", "Settings"]];

// آگهی‌های نمونه بازار خرید و فروش گیفت بین ممبرها
const INITIAL_MARKET = [
  { id: "m1", gift: GIFTS[2], price: 1750, seller: "ROXY", icon: "🦊" },
  { id: "m2", gift: GIFTS[3], price: 1250, seller: "Mahan", icon: "🎮" },
  { id: "m3", gift: GIFTS[6], price: 380, seller: "Sara", icon: "🌸" },
];

function Modal({ children, onClose, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,.62)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-[28px] p-4" style={{ background: t.bg2, border: `1px solid ${t.hair}`, boxShadow: "0 25px 80px rgba(0,0,0,.45)" }} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function GiftCard({ gift, t, onSend }) {
  return (
    <button onClick={() => onSend(gift)} className="rounded-2xl p-3 text-left transition-transform active:scale-95" style={{ background: t.card, border: `1px solid ${gift.glow}44`, boxShadow: `0 0 18px ${gift.glow}18` }}>
      <div className="h-16 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{ background: `radial-gradient(circle, ${gift.glow}2C, transparent 68%)` }}>
        <span className="text-4xl" style={{ filter: `drop-shadow(0 0 9px ${gift.glow})`, animation: gift.rarity === "Legendary" ? "floatGift 2.5s ease-in-out infinite" : "none" }}>{gift.icon}</span>
      </div>
      <div className="mt-2" style={{ color: t.text, fontSize: 11.5, fontWeight: 700 }}>{gift.name}</div>
      <div className="flex items-center justify-between mt-1"><span style={{ color: gift.glow, fontSize: 9.5 }}>{gift.rarity}</span><span style={{ color: t.soft, fontSize: 10 }}>🪙 {gift.price.toLocaleString()}</span></div>
    </button>
  );
}

function PremiumModal({ t, onClose, onBuyPlan }) {
  return (
    <Modal t={t} onClose={onClose}>
      <div className="text-center relative overflow-hidden rounded-3xl p-4" style={{ background: `radial-gradient(circle at 50% 0%, ${t.gold}25, transparent 55%)` }}>
        <div className="text-5xl" style={{ animation: "crownFloat 2s ease-in-out infinite" }}>👑</div>
        <div style={{ color: t.text, fontSize: 20, fontWeight: 800, marginTop: 8 }}>XZEOUS Premium</div>
        <div style={{ color: t.soft, fontSize: 11.5, lineHeight: 1.7, marginTop: 5 }}>پروفایلت رو خاص‌تر کن و قابلیت‌های ویژه XZEOUS رو باز کن.</div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {["✨ پروفایل متحرک", "💎 رینگ Premium", "🎨 تم‌های ویژه", "🎁 گیفت‌های ویژه", "🏆 Badgeهای اختصاصی", "⭐ ریاکشن اختصاصی"].map(x => (
            <div key={x} className="rounded-xl px-2 py-2" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft, fontSize: 10.5 }}>{x}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {PREMIUM_PLANS.map(pl => (
          <button key={pl.id} onClick={() => onBuyPlan(pl)} className="w-full rounded-2xl p-3 text-right relative active:scale-95" style={{ background: t.card, border: `1px solid ${t.gold}44` }}>
            {pl.tag && <span className="absolute -top-2 left-3 rounded-full px-2 py-0.5" style={{ background: t.gold, color: "#1B1407", fontSize: 8.5, fontWeight: 800 }}>{pl.tag}</span>}
            <div className="flex justify-between items-center">
              <span style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>{pl.label}</span>
              <span style={{ color: t.gold, fontWeight: 900, fontSize: 13 }}>🪙 {pl.coins.toLocaleString()}</span>
            </div>
            <div style={{ color: t.dim, fontSize: 9.5, marginTop: 5, lineHeight: 1.8 }}>{pl.features.join(" · ")}</div>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-3 w-full py-2" style={{ color: t.dim, fontSize: 11 }}>فعلاً نه</button>
    </Modal>
  );
}

function CoinModal({ t, onClose }) {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Modal t={t} onClose={onClose}>
        <div className="text-center py-3">
          <div style={{ fontSize: 44 }}>✅</div>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 15, marginTop: 8 }}>درخواستت ثبت شد</div>
          <div style={{ color: t.dim, fontSize: 11, marginTop: 6, lineHeight: 1.8 }}>ادمین بعد از بررسی واریزی، {selected.coins.toLocaleString()} X-Coin رو براتون شارژ می‌کنه 🖤</div>
          <button onClick={onClose} className="w-full rounded-2xl py-3 mt-4" style={{ background: t.green, color: "#fff", fontWeight: 800 }}>باشه</button>
        </div>
      </Modal>
    );
  }

  if (selected) {
    return (
      <Modal t={t} onClose={onClose}>
        <div style={{ color: t.text, fontSize: 16, fontWeight: 800 }}>پرداخت {selected.coins.toLocaleString()} X-Coin</div>
        <div style={{ color: t.dim, fontSize: 10.5, marginTop: 2 }}>مبلغ رو به شماره کارت زیر واریز کن</div>
        <div className="rounded-2xl p-4 mt-3 text-center" style={{ background: t.card, border: `1px solid ${t.gold}44` }}>
          <div style={{ color: t.gold, fontSize: 19, fontWeight: 900, letterSpacing: 1 }}>6219-8613-5138-0018</div>
          <div style={{ color: t.soft, fontSize: 10.5, marginTop: 4 }}>به نام: مدیریت XZEOUS</div>
          <div style={{ color: t.text, fontSize: 22, fontWeight: 900, marginTop: 10 }}>{selected.toman.toLocaleString()} تومان</div>
        </div>
        <div className="rounded-2xl p-3 mt-3" style={{ background: `${t.green}15`, border: `1px solid ${t.green}44` }}>
          <div style={{ color: t.green, fontSize: 10, fontWeight: 700 }}>📌 چطور تأیید بدم؟</div>
          <div style={{ color: t.soft, fontSize: 9.5, marginTop: 6, lineHeight: 1.8 }}>
            بعد از واریز، اسکرین‌شات رسید یا شماره پیگیری تراکنش رو برای پشتیبانی XZEOUS در چت ارسال کن تا شارژ سکه‌ت رو انجام بدیم.
          </div>
        </div>
        <div style={{ color: t.dim, fontSize: 9.5, marginTop: 8, lineHeight: 1.8 }}>ادمین دستی حساب‌ت رو شارژ می‌کنه، سکه به‌صورت خودکار اضافه نمیشه.</div>
        <button onClick={() => setDone(true)} className="w-full rounded-2xl py-3 mt-3" style={{ background: `linear-gradient(135deg,${t.gold},#C98D32)`, color: "#1B1407", fontWeight: 800 }}>واریز کردم ✅</button>
        <button onClick={() => setSelected(null)} className="w-full mt-2 py-2" style={{ color: t.dim, fontSize: 11 }}>بازگشت</button>
      </Modal>
    );
  }

  return (
    <Modal t={t} onClose={onClose}>
      <div style={{ color: t.text, fontSize: 18, fontWeight: 800 }}>🪙 خرید X-Coins</div>
      <div style={{ color: t.dim, fontSize: 11, marginTop: 3 }}>برای خرید Gift، تم و Premium</div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {COIN_PACKS.map(p => (
          <button key={p.coins} onClick={() => setSelected(p)} className="rounded-2xl p-3 text-left active:scale-95" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
            <div style={{ fontSize: 20 }}>🪙</div>
            <div style={{ color: t.text, fontWeight: 800, fontSize: 14 }}>{p.coins.toLocaleString()}</div>
            <div style={{ color: t.soft, fontSize: 10, marginTop: 2 }}>{p.toman.toLocaleString()} تومان</div>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="w-full mt-3 py-2" style={{ color: t.dim, fontSize: 11 }}>بستن</button>
    </Modal>
  );
}

function GiftModal({ t, gift, onClose, onConfirm }) {
  return (
    <Modal t={t} onClose={onClose}>
      <div className="text-center">
        <div className="text-6xl" style={{ filter: `drop-shadow(0 0 16px ${gift.glow})`, animation: "floatGift 2s ease-in-out infinite" }}>{gift.icon}</div>
        <div style={{ color: t.text, fontSize: 18, fontWeight: 800, marginTop: 8 }}>{gift.name}</div>
        <div style={{ color: gift.glow, fontSize: 10, marginTop: 3 }}>{gift.rarity}</div>
        <div style={{ color: t.soft, fontSize: 11, marginTop: 8 }}>این Gift به پروفایل XZEOUS اضافه میشه و در Showcase نمایش داده میشه.</div>
        <button onClick={onConfirm} className="w-full rounded-2xl py-3 mt-4" style={{ background: `linear-gradient(135deg, ${t.pink}, ${t.green})`, color: "#fff", fontWeight: 800, fontSize: 13 }}>ارسال Gift · 🪙 {gift.price.toLocaleString()}</button>
        <button onClick={onClose} className="mt-2" style={{ color: t.dim, fontSize: 11 }}>لغو</button>
      </div>
    </Modal>
  );
}

function UnboxModal({ t, gift, onClose }) {
  const [stage, setStage] = useState("shake");
  useEffect(() => {
    const timer = setTimeout(() => setStage("open"), 850);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Modal t={t} onClose={stage === "open" ? onClose : () => {}}>
      <div className="text-center py-4 relative overflow-hidden" style={{ minHeight: 190 }}>
        {stage === "shake" ? (
          <div style={{ fontSize: 70, animation: "boxShake .35s ease-in-out infinite" }}>🎁</div>
        ) : (
          <>
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} style={{ position: "absolute", left: `${8 + i * 9}%`, top: "38%", fontSize: 14, animation: `sparkle .9s ease-out ${i * 0.05}s` }}>✨</span>
              ))}
            </div>
            <div style={{ fontSize: 76, filter: `drop-shadow(0 0 22px ${gift.glow})`, animation: "unboxPop .5s cubic-bezier(.34,1.56,.64,1)" }}>{gift.icon}</div>
          </>
        )}
        <div style={{ color: t.text, fontSize: 17, fontWeight: 800, marginTop: 10 }}>{stage === "shake" ? "در حال باز شدن..." : `${gift.name} گرفتی! 🎉`}</div>
        {stage === "open" && (
          <>
            <div style={{ color: gift.glow, fontSize: 10.5, marginTop: 3 }}>{gift.rarity}</div>
            <button onClick={onClose} className="w-full rounded-2xl py-3 mt-4" style={{ background: `linear-gradient(135deg, ${t.pink}, ${t.green})`, color: "#fff", fontWeight: 800 }}>افزودن به Showcase ✨</button>
          </>
        )}
      </div>
    </Modal>
  );
}

function MiniStat({ t, value, label }) { return <div className="rounded-2xl py-2 text-center" style={{ background: t.card, border: `1px solid ${t.hair}` }}><div style={{ color: t.text, fontSize: 13, fontWeight: 800 }}>{value}</div><div style={{ color: t.dim, fontSize: 9 }}>{label}</div></div>; }
function TabButton({ t, active, onClick, children }) { return <button onClick={onClick} className="flex-1 rounded-full py-2" style={{ background: active ? t.green : t.card, color: active ? "#fff" : t.soft, border: `1px solid ${active ? t.green : t.hair}`, fontSize: 9.5, fontWeight: 700 }}>{children}</button>; }

// حباب‌های گیفتِ انتخاب‌شده که دور آواتار می‌چرخن — وقتی رو پروفایل (خودت یا مخاطب) باز میشه
function GiftOrbit({ t, gifts }) {
  const list = gifts.slice(0, 6);
  const radius = 66;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ animation: "orbitSpin 16s linear infinite" }}>
      {list.map((g, i) => {
        const angle = (360 / list.length) * i;
        return (
          <div key={i} className="absolute rounded-full flex items-center justify-center" style={{
            width: 26, height: 26, left: "50%", top: "50%", marginLeft: -13, marginTop: -13,
            transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
            background: `${g.glow}22`, border: `1px solid ${g.glow}66`, boxShadow: `0 0 10px ${g.glow}55`,
          }}>
            <span style={{ fontSize: 13 }}>{g.icon}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProfileScreen({ t, premium, coins, setCoins, ownedGifts, setOwnedGifts, onPremium, equippedThemeObj, profileMeta, setProfileMeta, vipTier, isBirthday, leaderboardTop, onClaimMonthly, monthlyClaimed, showcaseIds, setShowcaseIds }) {
  const [section, setSection] = useState("showcase");
  const [gift, setGift] = useState(null);
  const [unboxGift, setUnboxGift] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const sendGift = g => { if (coins >= g.price) setGift(g); };
  const confirmGift = () => { if (!gift) return; setCoins(coins - gift.price); setOwnedGifts(prev => [gift, ...prev]); setUnboxGift(gift); setGift(null); };
  const ringGrad = equippedThemeObj ? equippedThemeObj.grad : `conic-gradient(${t.gold}, ${t.pink}, ${t.green}, ${t.gold})`;
  const toggleShowcase = id => setShowcaseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= 6 ? prev : [...prev, id]));
  const showcaseGifts = ownedGifts.filter(g => showcaseIds.includes(g.id));
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: t.bg }}>
      <div className="relative overflow-hidden px-4 pt-8 pb-5" style={{ background: premium ? `radial-gradient(circle at 50% -10%, ${t.gold}5C, ${t.gold}20 45%, transparent 72%)` : `radial-gradient(circle at 50% -10%, ${t.green}28, transparent 58%)` }}>
        {premium && <>
          <div className="absolute -top-24 -left-20 w-56 h-56 rounded-full" style={{ background: `${t.pink}28`, filter: "blur(32px)", animation: "blob 8s infinite" }} />
          <div className="absolute -top-16 -right-20 w-60 h-60 rounded-full" style={{ background: `${t.gold}30`, filter: "blur(32px)", animation: "blob 10s infinite reverse" }} />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full" style={{ background: `${t.gold}22`, filter: "blur(28px)" }} />
        </>}
        <div className="relative flex justify-between items-center"><span style={{ color: t.soft, fontSize: 24 }}>‹</span><button onClick={() => setEditOpen(true)} className="rounded-full flex items-center justify-center active:scale-90" style={{ width: 30, height: 30, background: t.card, border: `1px solid ${t.hair}`, color: t.soft, fontSize: 14 }}>✎</button></div>
        {isBirthday && (
          <div className="relative mt-2 rounded-2xl px-3 py-2 text-center" style={{ background: `${t.pink}18`, border: `1px solid ${t.pink}55` }}>
            <span style={{ color: t.pink, fontSize: 11, fontWeight: 800 }}>🎂 تولدت مبارک، {ME.name}! امروز روز توئه 🎉</span>
          </div>
        )}
        <div className="flex flex-col items-center relative mt-4">
          <div className="relative" style={{ width: 112, height: 112 }}>
            <div className="relative p-1 rounded-full" style={{ background: premium ? ringGrad : t.hair, boxShadow: premium ? `0 0 28px ${t.gold}55` : "none", animation: premium ? "ringSpin 8s linear infinite" : "none" }}>
              <div className="rounded-full flex items-center justify-center overflow-hidden" style={{ width: 104, height: 104, background: `linear-gradient(135deg, ${t.green}, ${t.deep})`, border: `4px solid ${t.bg}` }}>
                {profileMeta.photo ? <img src={profileMeta.photo} alt="" className="w-full h-full object-cover" /> : <span style={{ color: "#fff", fontWeight: 900, fontSize: 30 }}>XZ</span>}
              </div>
              <span className="absolute -right-1 -bottom-1 rounded-full flex items-center justify-center" style={{ width: 29, height: 29, background: t.bg2, border: `2px solid ${t.gold}`, fontSize: 15 }}>👑</span>
            </div>
            {showcaseGifts.length > 0 && <GiftOrbit t={t} gifts={showcaseGifts} />}
          </div>
          <div className="flex items-center gap-1 mt-3"><span style={{ color: vipTier.color || t.text, fontSize: 21, fontWeight: 900 }}>{profileMeta.name}</span>{premium && <span>✨</span>}{premium && <span title="Premium" style={{ fontSize: 15, filter: `drop-shadow(0 0 4px ${t.gold})` }}>💎</span>}</div>
          <div style={{ color: t.dim, fontSize: 11.5, marginTop: 1 }}>{profileMeta.handle} · {ME.id}</div>
          <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
            {premium
              ? <span className="px-3 py-1 rounded-full" style={{ background: `${t.gold}18`, border: `1px solid ${t.gold}55`, color: t.gold, fontSize: 9.5, fontWeight: 800 }}>XZEOUS PREMIUM</span>
              : <button onClick={onPremium} className="px-3 py-1 rounded-full" style={{ background: `${t.gold}16`, border: `1px solid ${t.gold}45`, color: t.gold, fontSize: 9.5, fontWeight: 800 }}>ارتقا به Premium ✨</button>}
            {vipTier.color && <span className="px-3 py-1 rounded-full" style={{ background: `${vipTier.color}18`, border: `1px solid ${vipTier.color}66`, color: vipTier.color, fontSize: 9.5, fontWeight: 800 }}>{vipTier.label}</span>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5"><MiniStat t={t} value="2.4K" label="Followers" /><MiniStat t={t} value={ownedGifts.length} label="Gifts" /><MiniStat t={t} value="18" label="Badges" /></div>
        {leaderboardTop && (
          <div className="mt-3 rounded-2xl p-3 flex items-center justify-between" style={{ background: `${t.gold}16`, border: `1px solid ${t.gold}55` }}>
            <div><div style={{ color: t.gold, fontSize: 11, fontWeight: 800 }}>🏆 نفر اول لیدربورد این ماه!</div><div style={{ color: t.dim, fontSize: 9, marginTop: 2 }}>جایزه ماهانه رو بگیر</div></div>
            <button onClick={onClaimMonthly} disabled={monthlyClaimed} className="rounded-full px-3 py-1.5" style={{ background: monthlyClaimed ? t.hair : t.gold, color: monthlyClaimed ? t.dim : "#1B1407", fontSize: 9.5, fontWeight: 800 }}>{monthlyClaimed ? "✓ گرفتی" : "🪙 100"}</button>
          </div>
        )}
      </div>

      <div className="px-4"><div className="rounded-2xl px-4 py-3" style={{ background: t.card, border: `1px solid ${t.hair}` }}><div style={{ color: t.text, fontSize: 13, fontWeight: 600 }}>{profileMeta.bio}</div><div style={{ color: t.dim, fontSize: 10.5, marginTop: 4 }}>ساخته شده برای خلاق‌ها، ادیتورها و کامیونیتی XZEOUS 🖤</div></div></div>

      <div className="px-4 mt-4 flex gap-1.5">
        <TabButton t={t} active={section === "showcase"} onClick={() => setSection("showcase")}>🎁 Showcase</TabButton>
        <TabButton t={t} active={section === "badges"} onClick={() => setSection("badges")}>🏆 Badges</TabButton>
        <TabButton t={t} active={section === "gifts"} onClick={() => setSection("gifts")}>🛍️ Gifts</TabButton>
        <TabButton t={t} active={section === "leaderboard"} onClick={() => setSection("leaderboard")}>📊 Rank</TabButton>
      </div>

      {section === "showcase" && (
        <div className="px-4 mt-3">
          <div className="rounded-3xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${t.green}18, ${t.pink}0D, ${t.card})`, border: `1px solid ${t.hair}` }}>
            <div className="absolute -right-8 -top-8 text-7xl opacity-20">🎁</div>
            <div style={{ color: t.text, fontSize: 14, fontWeight: 800 }}>XZEOUS Showcase</div>
            <div style={{ color: t.dim, fontSize: 10.5, marginTop: 2 }}>گیفت‌هایی که روی پروفایل نمایش میدی (حداکثر ۶ تا)</div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {(showcaseGifts.length ? showcaseGifts : GIFTS.slice(0, 4)).map((g, i) => (
                <div key={i} className="aspect-square rounded-2xl flex items-center justify-center" style={{ background: `${g.glow}12`, border: `1px solid ${g.glow}38` }}>
                  <span className="text-3xl" style={{ animation: "floatGift 3s ease-in-out infinite", animationDelay: `${i * .15}s` }}>{g.icon}</span>
                </div>
              ))}
            </div>
          </div>
          {ownedGifts.length > 0 && (
            <div className="mt-3">
              <div style={{ color: t.soft, fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>انتخاب کن کدوما نمایش داده بشن:</div>
              <div className="grid grid-cols-4 gap-2 pb-2">
                {ownedGifts.map((g, i) => {
                  const on = showcaseIds.includes(g.id);
                  return (
                    <button key={i} onClick={() => toggleShowcase(g.id)} className="aspect-square rounded-2xl flex flex-col items-center justify-center relative active:scale-95" style={{ background: on ? `${g.glow}22` : t.card, border: `1px solid ${on ? g.glow : t.hair}` }}>
                      {on && <span className="absolute top-1 right-1" style={{ fontSize: 9, color: t.mint }}>✓</span>}
                      <span className="text-2xl">{g.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {section === "badges" && (
        <div className="px-4 mt-3 grid grid-cols-2 gap-2">
          {BADGES.map(([icon, name, desc, color]) => (
            <div key={name} className="rounded-2xl p-3 relative overflow-hidden" style={{ background: `radial-gradient(circle at 30% 20%, ${color}22, ${t.card})`, border: `1px solid ${color}55` }}>
              <div className="flex items-center gap-2"><span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</span><div><div style={{ color: t.text, fontSize: 11.5, fontWeight: 800 }}>{name}</div><div style={{ color: t.dim, fontSize: 9.5, marginTop: 2 }}>{desc}</div></div></div>
            </div>
          ))}
        </div>
      )}

      {section === "gifts" && <div className="px-4 mt-3 grid grid-cols-2 gap-2 pb-5">{GIFTS.map(g => <GiftCard key={g.id} gift={g} t={t} onSend={sendGift} />)}</div>}

      {section === "leaderboard" && (
        <div className="px-4 mt-3 space-y-2 pb-5">
          {LEADERBOARD.map((u, i) => {
            const total = u.sent + u.received;
            const isMe = u.name === ME.name;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            return (
              <div key={u.name} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: isMe ? `${t.gold}14` : t.card, border: `1px solid ${isMe ? t.gold + "66" : t.hair}` }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: t.soft, width: 26, textAlign: "center" }}>{medal}</span>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ background: `linear-gradient(135deg,${t.green}55,${t.pink}30)`, fontWeight: 800, color: t.text }}>{u.icon}</div>
                <div className="flex-1"><div className="flex items-center gap-1" style={{ color: t.text, fontSize: 12, fontWeight: 800 }}><span>{u.name}{isMe && " (تو)"}</span>{(isMe ? premium : u.premium) && <span style={{ fontSize: 10 }}>💎</span>}</div><div style={{ color: t.dim, fontSize: 9.5, marginTop: 2 }}>ارسال {u.sent} · دریافت {u.received}</div></div>
                <div style={{ color: t.gold, fontWeight: 900, fontSize: 13 }}>{total}</div>
              </div>
            );
          })}
        </div>
      )}

      {gift && <GiftModal t={t} gift={gift} onClose={() => setGift(null)} onConfirm={confirmGift} />}
      {unboxGift && <UnboxModal t={t} gift={unboxGift} onClose={() => setUnboxGift(null)} />}
      {editOpen && <EditProfileModal t={t} profileMeta={profileMeta} setProfileMeta={setProfileMeta} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

// پنل شناور ادیت پروفایل — گوشه‌های بریده + افکت گلو، به‌جای رفتن تو Settings
function EditProfileModal({ t, profileMeta, setProfileMeta, onClose }) {
  const [draft, setDraft] = useState(profileMeta);
  const photoRef = useRef(null);
  const onPhoto = e => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    setDraft(d => ({ ...d, photo: URL.createObjectURL(file) }));
    e.target.value = "";
  };
  const save = () => { setProfileMeta(draft); onClose(); };
  const clip = "polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,.66)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div className="w-full max-w-sm p-5 relative" style={{ clipPath: clip, background: t.bg2, border: `1px solid ${t.gold}55`, boxShadow: `0 0 40px ${t.gold}33, 0 25px 80px rgba(0,0,0,.45)` }} onClick={e => e.stopPropagation()}>
        <div style={{ color: t.text, fontSize: 15, fontWeight: 800 }}>✎ ویرایش پروفایل</div>
        <div className="flex items-center gap-3 mt-4">
          <div className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${t.green}, ${t.deep})`, boxShadow: `0 0 14px ${t.gold}33` }}>
            {draft.photo ? <img src={draft.photo} alt="" className="w-full h-full object-cover" /> : <span style={{ color: "#fff", fontWeight: 900 }}>XZ</span>}
          </div>
          <button onClick={() => photoRef.current && photoRef.current.click()} className="rounded-xl px-3 py-1.5" style={{ background: t.hair, color: t.soft, fontSize: 10, fontWeight: 700 }}>تغییر عکس</button>
          <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        </div>
        <div className="mt-3">
          <div style={{ color: t.soft, fontSize: 9.5, marginBottom: 4 }}>نام</div>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl" style={{ background: t.bg, color: t.text, fontSize: 11.5, border: `1px solid ${t.hair}` }} />
        </div>
        <div className="mt-2.5">
          <div style={{ color: t.soft, fontSize: 9.5, marginBottom: 4 }}>آیدی (غیرقابل‌تغییر)</div>
          <div className="w-full px-3 py-2 rounded-xl" style={{ background: t.hair, color: t.dim, fontSize: 11.5 }}>{ME.id}</div>
        </div>
        <div className="mt-2.5">
          <div style={{ color: t.soft, fontSize: 9.5, marginBottom: 4 }}>بیو</div>
          <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl resize-none" style={{ background: t.bg, color: t.text, fontSize: 11.5, border: `1px solid ${t.hair}` }} />
        </div>
        <div className="mt-2.5">
          <div style={{ color: t.soft, fontSize: 9.5, marginBottom: 4 }}>تاریخ تولد (MM-DD)</div>
          <input value={draft.birthday} onChange={e => setDraft(d => ({ ...d, birthday: e.target.value }))} placeholder="08-22" className="w-full px-3 py-2 rounded-xl" style={{ background: t.bg, color: t.text, fontSize: 11.5, border: `1px solid ${t.hair}` }} />
        </div>
        <button onClick={save} className="w-full rounded-2xl py-3 mt-4" style={{ background: `linear-gradient(135deg,${t.gold},#C98D32)`, color: "#1B1407", fontWeight: 800, fontSize: 12.5 }}>ذخیره</button>
        <button onClick={onClose} className="w-full mt-2 py-1.5" style={{ color: t.dim, fontSize: 11 }}>انصراف</button>
      </div>
    </div>
  );
}

function ChatsScreen({ t, mode, onOpenChat, onOpenProfile }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  // فقط ۱ پیوی (Nika) + کامیونیتی چنل XZEOUS باقی مونده — بقیه پیوی‌ها حذف شدن
  const chats = [
    { name: "Nika", msg: "یه ایده برای UI دارم 👀", time: "دیروز", icon: "🐰", online: true, type: "dm" },
    { name: "XZEOUS Community", msg: "پرمیوم استور آپدیت شد 🖤", time: "۱۰:۲۲", icon: "👑", online: false, type: "channel", members: 6770 },
  ];
  const filtered = chats.filter(c => c.name.includes(q) || c.msg.includes(q));
  return (
    <div className="h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-4 pt-8 pb-3 flex justify-between"><span style={{ color: t.text, fontSize: 22, fontWeight: 900 }}>Chats</span><span style={{ color: t.soft }}>✎</span></div>
      <div className="px-4 pb-3">
        <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2" style={{
          background: "linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.02))",
          border: `1px solid ${focused ? t.green + "88" : t.hair}`,
          boxShadow: focused ? `0 0 24px ${t.green}30` : "none",
          backdropFilter: "blur(18px)",
          transition: "all .35s ease",
        }}>
          <span style={{ color: t.dim, fontSize: 13 }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="جستجو در پیام‌ها" className="flex-1 bg-transparent outline-none" style={{ color: t.text, fontSize: 12 }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((c, i) => (
          <div key={c.name}>
            <button onClick={() => onOpenChat(c)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:scale-[.99]">
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: `linear-gradient(135deg, ${t.green}55, ${t.pink}30)`, border: `1px solid ${t.hair}` }}>
                {c.icon}
                {c.online && <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full" style={{ background: t.mint, border: `2px solid ${t.bg}` }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span onClick={e => { e.stopPropagation(); onOpenProfile && onOpenProfile(c); }} style={{ color: t.text, fontSize: 13.5, fontWeight: 800 }}>{c.name}{c.type === "channel" && <span style={{ color: t.dim, fontWeight: 600 }}> · {c.members.toLocaleString()} عضو</span>}</span>
                  <span style={{ color: t.dim, fontSize: 9.5 }}>{c.time}</span>
                </div>
                <div className="truncate" style={{ color: t.dim, fontSize: 11, marginTop: 3 }}>{c.msg}</div>
              </div>
            </button>
            {i < filtered.length - 1 && (
              <div className="px-4">
                <div style={{
                  height: 1,
                  background: mode === "dark"
                    ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.02) 8%, rgba(255,255,255,.22) 50%, rgba(255,255,255,.02) 92%, transparent 100%)"
                    : `linear-gradient(90deg, transparent 0%, ${t.hair} 12%, ${t.hair} 88%, transparent 100%)`,
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberProfileScreen({ t, chat, onBack }) {
  const p = MEMBER_PROFILES[chat.name] || { name: chat.name, handle: "@" + chat.name.toLowerCase(), id: "XS-0000", icon: chat.icon, bio: "بیوی مخاطب هنوز ثبت نشده", premium: false, followers: "—", badges: [], gifts: [] };
  return (
    <div className="h-full overflow-y-auto" style={{ background: t.bg }}>
      <div className="relative overflow-hidden px-4 pt-8 pb-5" style={{ background: p.premium ? `radial-gradient(circle at 50% -10%, ${t.gold}5C, ${t.gold}20 45%, transparent 72%)` : `radial-gradient(circle at 50% -10%, ${t.green}28, transparent 58%)` }}>
        {p.premium && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full pointer-events-none" style={{ background: `${t.gold}22`, filter: "blur(26px)" }} />
        )}
        <button onClick={onBack} style={{ color: t.soft, fontSize: 22 }}>‹</button>
        <div className="flex flex-col items-center relative mt-4">
          <div className="relative" style={{ width: 96, height: 96 }}>
            <div className="relative p-1 rounded-full" style={{ background: p.premium ? `conic-gradient(${t.gold},${t.pink},${t.green},${t.gold})` : t.hair, boxShadow: p.premium ? `0 0 24px ${t.gold}44` : "none" }}>
              <div className="rounded-full flex items-center justify-center text-4xl" style={{ width: 96, height: 96, background: `linear-gradient(135deg, ${t.green}, ${t.deep})`, border: `4px solid ${t.bg}` }}>{p.icon}</div>
            </div>
            {p.gifts.length > 0 && <GiftOrbit t={t} gifts={p.gifts} />}
          </div>
          <div className="flex items-center gap-1 mt-3"><span style={{ color: t.text, fontSize: 19, fontWeight: 900 }}>{p.name}</span>{p.premium && <span>✨</span>}{p.premium && <span title="Premium" style={{ fontSize: 14, filter: `drop-shadow(0 0 4px ${t.gold})` }}>💎</span>}</div>
          <div style={{ color: t.dim, fontSize: 11, marginTop: 1 }}>{p.handle} · {p.id}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5"><MiniStat t={t} value={p.followers} label="Followers" /><MiniStat t={t} value={p.gifts.length} label="Gifts" /><MiniStat t={t} value={p.badges.length} label="Badges" /></div>
      </div>
      <div className="px-4 mt-1"><div className="rounded-2xl px-4 py-3" style={{ background: t.card, border: `1px solid ${t.hair}` }}><div style={{ color: t.text, fontSize: 12.5, fontWeight: 600 }}>{p.bio}</div></div></div>
      {p.badges.length > 0 && (
        <div className="px-4 mt-3 flex gap-2">
          {p.badges.map((b, i) => <span key={i} className="rounded-full px-2.5 py-1.5" style={{ background: t.card, border: `1px solid ${t.hair}`, fontSize: 14 }}>{b}</span>)}
        </div>
      )}
      {p.gifts.length > 0 && (
        <div className="px-4 mt-3 pb-6">
          <div style={{ color: t.text, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>🎁 Showcase</div>
          <div className="grid grid-cols-4 gap-2">
            {p.gifts.map((g, i) => (
              <div key={i} className="aspect-square rounded-2xl flex items-center justify-center" style={{ background: `${g.glow}12`, border: `1px solid ${g.glow}38` }}>
                <span className="text-2xl">{g.icon}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelProfileScreen({ t, chat, onBack }) {
  const c = CHANNEL_PROFILES[chat.name] || { name: chat.name, handle: "@" + chat.name.toLowerCase().replace(/\s+/g, ""), id: "CH-0000", icon: chat.icon, desc: "توضیحاتی ثبت نشده", members: chat.members || 0, verified: false };
  return (
    <div className="h-full overflow-y-auto" style={{ background: t.bg }}>
      <div className="relative overflow-hidden px-4 pt-8 pb-5" style={{ background: `radial-gradient(circle at 50% -10%, ${t.gold}22, transparent 58%)` }}>
        <button onClick={onBack} style={{ color: t.soft, fontSize: 22 }}>‹</button>
        <div className="flex flex-col items-center relative mt-4">
          <div className="rounded-full flex items-center justify-center text-4xl" style={{ width: 96, height: 96, background: `linear-gradient(135deg, ${t.green}, ${t.deep})`, border: `4px solid ${t.bg}` }}>{c.icon}</div>
          <div className="flex items-center gap-1 mt-3"><span style={{ color: t.text, fontSize: 19, fontWeight: 900 }}>{c.name}</span>{c.verified && <span style={{ color: t.mint }}>✔️</span>}</div>
          <div style={{ color: t.dim, fontSize: 11, marginTop: 1 }}>{c.handle} · {c.id}</div>
          <div className="mt-3 px-3 py-1 rounded-full" style={{ background: `${t.green}18`, border: `1px solid ${t.green}55`, color: t.mint, fontSize: 10, fontWeight: 800 }}>{c.members.toLocaleString()} عضو</div>
        </div>
      </div>
      <div className="px-4 mt-1 pb-6"><div className="rounded-2xl px-4 py-3" style={{ background: t.card, border: `1px solid ${t.hair}` }}><div style={{ color: t.text, fontSize: 12.5, fontWeight: 600, lineHeight: 1.8 }}>{c.desc}</div></div></div>
    </div>
  );
}

function ChatScreen({ t, chat, onBack, premium, ownedGifts, setOwnedGifts, onOpenProfile }) {
  const isChannel = chat.type === "channel";
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(
    isChannel
      ? [
          { id: 1, from: "them", text: "به کامیونیتی رسمی XZEOUS خوش اومدید! 🖤", time: "۰۹:۰۰", reactions: {} },
          { id: 2, from: "them", text: "پرمیوم استور آپدیت شد و تم‌های جدید اضافه شدن ✨", time: "۱۰:۲۲", reactions: {} },
          { id: 3, from: "them", text: "به‌زودی گیفت‌های محدود جدید میان، تو استور چک کنید 🎁", time: "۱۱:۴۰", reactions: {} },
        ]
      : [
          { id: 1, from: "them", text: "سلاممم 👋", time: "۱۰:۱۸", reactions: {} },
          { id: 2, from: "them", text: "Premium Store رو دیدی؟ خیلی کیوت شده 😭", time: "۱۰:۱۹", reactions: {} },
          { id: 3, from: "me", text: "آرههه هنوز داریم خوشگل‌ترش می‌کنیم 😂", time: "۱۰:۲۰", reactions: {} },
        ]
  );
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [reactOpenId, setReactOpenId] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [textFocused, setTextFocused] = useState(false);
  const imgRef = useRef(null);
  const fileRef = useRef(null);

  const resetComposer = () => { setReplyTo(null); setEditingId(null); };

  const send = () => {
    if (!text.trim()) return;
    if (editingId) {
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, text, edited: true } : m));
    } else {
      setMessages(prev => [...prev, {
        id: Date.now(), from: "me", text, time: "الان",
        replyTo: replyTo ? { from: replyTo.from, text: replyTo.text || "پیوست" } : null,
        reactions: {},
      }]);
    }
    setText(""); resetComposer();
  };

  const startEdit = m => { if (m.from !== "me") return; setEditingId(m.id); setText(m.text || ""); setActiveId(null); };
  const startReply = m => { setReplyTo(m); setEditingId(null); setActiveId(null); };
  const deleteMsg = id => { setMessages(prev => prev.filter(m => m.id !== id)); setActiveId(null); };
  const forwardMsg = m => {
    setMessages(prev => [...prev, { id: Date.now(), from: "me", text: m.text, image: m.image, time: "الان", forwarded: true, reactions: {} }]);
    setActiveId(null);
  };
  const toggleReaction = (id, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== id) return m;
      const r = { ...m.reactions };
      if (r[emoji]) delete r[emoji]; else r[emoji] = true;
      return { ...m, reactions: r };
    }));
    setReactOpenId(null); setActiveId(null);
  };
  const addImage = e => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages(prev => [...prev, { id: Date.now(), from: "me", image: url, time: "الان", reactions: {} }]);
    setAttachOpen(false); e.target.value = "";
  };
  const addFile = e => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    setMessages(prev => [...prev, { id: Date.now(), from: "me", file: { name: file.name, size: file.size }, time: "الان", reactions: {} }]);
    setAttachOpen(false); e.target.value = "";
  };
  const sendVoice = () => {
    setRecording(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), from: "me", voice: { duration: Math.floor(Math.random() * 40 + 6) }, time: "الان", reactions: {} }]);
      setRecording(false);
    }, 1100);
  };
  const addEmoji = e => setText(prev => prev + e);
  const sendGiftInChat = g => {
    // مصرف یه واحد از گیفتِ خودت — دیگه نمی‌تونی همون گیفت رو بی‌نهایت بار بفرستی
    // TODO: وقتی بک‌اند/Supabase وصل شد، این باید سمت سرور هم بشه: کسر از انبار فرستنده + اضافه به گیرنده
    setOwnedGifts(prev => {
      const idx = prev.findIndex(x => x.id === g.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    setMessages(prev => [...prev, { id: Date.now(), from: "me", giftSent: g, time: "الان", reactions: {} }]);
    setGiftPickerOpen(false);
  };
  const sendSticker = s => {
    setMessages(prev => [...prev, { id: Date.now(), from: "me", sticker: s, time: "الان", reactions: {} }]);
    setEmojiOpen(false);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-4 pt-7 pb-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.hair}` }}>
        <button onClick={onBack} style={{ color: t.soft, fontSize: 22 }}>‹</button>
        <button onClick={() => onOpenProfile && onOpenProfile(chat)} className="flex items-center gap-3 flex-1 text-left">
          <div className="w-9 h-9 rounded-full flex items-center justify-center">{chat.icon}</div>
          <div>
            <div className="flex items-center gap-1"><span style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>{chat.name}</span>{!isChannel && MEMBER_PROFILES[chat.name]?.premium && <span style={{ fontSize: 11 }}>💎</span>}</div>
            <div style={{ color: t.mint, fontSize: 9.5 }}>{isChannel ? `${chat.members.toLocaleString()} عضو` : "online"}</div>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`} style={{ animation: "bubbleIn .28s cubic-bezier(.34,1.56,.64,1)" }}>
            <div
              onClick={() => !isChannel && setActiveId(activeId === m.id ? null : m.id)}
              className="max-w-[78%] rounded-2xl px-3 py-2 cursor-pointer"
              style={{ background: m.from === "me" ? `linear-gradient(135deg, ${t.green}, ${t.deep})` : t.card, color: m.from === "me" ? "#fff" : t.text, border: `1px solid ${m.from === "me" ? t.green : t.hair}`, fontSize: 12 }}
            >
              {isChannel && m.from === "them" && <div style={{ fontSize: 9.5, fontWeight: 800, opacity: .85, marginBottom: 3 }}>👑 بنیان‌گذار</div>}
              {m.forwarded && <div style={{ opacity: .7, fontSize: 9, marginBottom: 3 }}>↪ فوروارد شده</div>}
              {m.replyTo && (
                <div className="rounded-lg px-2 py-1 mb-1" style={{ background: "rgba(0,0,0,.22)", borderRight: `2px solid ${t.mint}` }}>
                  <div style={{ fontSize: 9, opacity: .85 }}>{m.replyTo.from === "me" ? "شما" : chat.name}</div>
                  <div style={{ fontSize: 10, opacity: .75 }}>{m.replyTo.text}</div>
                </div>
              )}
              {m.image && <img src={m.image} alt="" className="rounded-xl mb-1" style={{ maxWidth: 180, display: "block" }} />}
              {m.voice && (
                <div className="flex items-center gap-2" style={{ minWidth: 130 }}>
                  <span>▶️</span>
                  <div className="flex-1 flex items-center gap-0.5">
                    {Array.from({ length: 16 }).map((_, i) => <span key={i} style={{ width: 2, height: 4 + (i % 5) * 3, background: "rgba(255,255,255,.6)", borderRadius: 2 }} />)}
                  </div>
                  <span style={{ fontSize: 9, opacity: .8 }}>0:{String(m.voice.duration).padStart(2, "0")}</span>
                </div>
              )}
              {m.file && (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>📄</span>
                  <div><div style={{ fontSize: 11, fontWeight: 700 }}>{m.file.name}</div><div style={{ fontSize: 9, opacity: .75 }}>{(m.file.size / 1024).toFixed(0)} KB</div></div>
                </div>
              )}
              {m.giftSent && (
                <div className="text-center py-1">
                  <div className="text-4xl" style={{ filter: `drop-shadow(0 0 12px ${m.giftSent.glow || t.gold})`, animation: "floatGift 2.4s ease-in-out infinite" }}>{m.giftSent.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>🎁 {m.giftSent.name} فرستاده شد</div>
                </div>
              )}
              {m.sticker && <div className="text-5xl text-center py-1">{m.sticker.icon}</div>}
              {m.text && <div>{m.text}</div>}
              <div style={{ opacity: .55, fontSize: 8, marginTop: 3, textAlign: "right" }}>{m.edited && "ویرایش شده · "}{m.time}</div>
            </div>

            {Object.keys(m.reactions).length > 0 && (
              <div className="flex gap-1 mt-1">
                {Object.keys(m.reactions).map(em => <span key={em} className="rounded-full px-1.5 py-0.5" style={{ background: t.card, border: `1px solid ${t.hair}`, fontSize: 10 }}>{em}</span>)}
              </div>
            )}

            {isChannel && (
              <div className="flex gap-1 mt-1 rounded-full px-2 py-1 items-center" style={{ background: t.card, border: `1px solid ${t.hair}`, animation: "menuPop .22s cubic-bezier(.34,1.56,.64,1)" }}>
                {["👍", "❤️", "🔥", "😂"].map(em => <button key={em} onClick={() => toggleReaction(m.id, em)} style={{ fontSize: 13 }}>{em}</button>)}
              </div>
            )}

            {!isChannel && activeId === m.id && (
              <div className="flex flex-wrap gap-1 mt-1 rounded-2xl p-1.5" style={{ background: t.card, border: `1px solid ${t.hair}`, animation: "menuPop .22s cubic-bezier(.34,1.56,.64,1)" }}>
                <button onClick={() => startReply(m)} className="rounded-full px-2 py-1" style={{ color: t.soft, fontSize: 10 }}>↩️ Reply</button>
                <button onClick={() => forwardMsg(m)} className="rounded-full px-2 py-1" style={{ color: t.soft, fontSize: 10 }}>➡️ Forward</button>
                <button onClick={() => setReactOpenId(reactOpenId === m.id ? null : m.id)} className="rounded-full px-2 py-1" style={{ color: t.soft, fontSize: 10 }}>😊 React</button>
                {m.from === "me" && m.text && <button onClick={() => startEdit(m)} className="rounded-full px-2 py-1" style={{ color: t.soft, fontSize: 10 }}>✏️ Edit</button>}
                {m.from === "me" && <button onClick={() => deleteMsg(m.id)} className="rounded-full px-2 py-1" style={{ color: "#F17A7A", fontSize: 10 }}>🗑️ Delete</button>}
              </div>
            )}

            {!isChannel && reactOpenId === m.id && (
              <div className="flex gap-1 mt-1 rounded-full px-2 py-1.5" style={{ background: t.card, border: `1px solid ${t.hair}`, animation: "menuPop .22s cubic-bezier(.34,1.56,.64,1)" }}>
                {["❤️", "😂", "😘", "👍", "👎"].map(em => <button key={em} onClick={() => toggleReaction(m.id, em)} style={{ fontSize: 15 }}>{em}</button>)}
                <button onClick={() => premium && toggleReaction(m.id, "⭐")} style={{ fontSize: 15, opacity: premium ? 1 : .35 }}>⭐</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!isChannel && (replyTo || editingId) && (
        <div className="px-3 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${t.hair}` }}>
          <div style={{ color: t.soft, fontSize: 10.5 }}>{editingId ? "✏️ در حال ویرایش پیام" : `↩️ پاسخ به: ${(replyTo.text || "پیوست").slice(0, 30)}`}</div>
          <button onClick={resetComposer} style={{ color: t.dim, fontSize: 13 }}>✕</button>
        </div>
      )}

      {!isChannel && attachOpen && (
        <div className="px-3 pb-1 flex gap-2">
          <button onClick={() => imgRef.current && imgRef.current.click()} className="rounded-xl px-3 py-2" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft, fontSize: 10.5 }}>🖼️ عکس</button>
          <button onClick={() => fileRef.current && fileRef.current.click()} className="rounded-xl px-3 py-2" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft, fontSize: 10.5 }}>📄 فایل</button>
          <input ref={imgRef} type="file" accept="image/*" onChange={addImage} className="hidden" />
          <input ref={fileRef} type="file" onChange={addFile} className="hidden" />
        </div>
      )}

      {!isChannel && emojiOpen && (
        <div className="px-3 pb-2">
          <div style={{ color: t.dim, fontSize: 9, fontWeight: 700, margin: "4px 2px" }}>😺 استیکر XZEOUS</div>
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {STICKERS.map(s => (
              <button key={s.id} onClick={() => sendSticker(s)} className="flex-shrink-0 rounded-2xl flex items-center justify-center relative" style={{ width: 46, height: 46, background: t.card, border: `1px solid ${t.hair}`, fontSize: 22 }}>
                {s.icon}
                {!s.free && <span className="absolute -bottom-1 -left-1 rounded-full px-1" style={{ background: t.bg2, border: `1px solid ${t.hair}`, fontSize: 6.5, color: t.gold }}>🪙{s.cost}</span>}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {["😀", "😂", "😍", "😘", "😎", "🥹", "😭", "🔥", "🖤", "💚", "👍", "👎", "🎉", "🙏", "😴", "🤔"].map(e => <button key={e} onClick={() => addEmoji(e)} style={{ fontSize: 17 }}>{e}</button>)}
          </div>
        </div>
      )}
      {!isChannel && giftPickerOpen && (
        <div className="px-3 pb-2">
          <div style={{ color: t.dim, fontSize: 9, fontWeight: 700, margin: "4px 2px" }}>🎁 گیفت‌های خودت رو بفرست</div>
          {ownedGifts.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ownedGifts.map((g, i) => (
                <button key={i} onClick={() => sendGiftInChat(g)} className="flex-shrink-0 rounded-2xl p-2 flex flex-col items-center" style={{ width: 62, background: t.card, border: `1px solid ${g.glow}44` }}>
                  <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${g.glow})` }}>{g.icon}</span>
                  <span style={{ color: t.soft, fontSize: 8, marginTop: 2, textAlign: "center" }}>{g.name}</span>
                </button>
              ))}
            </div>
          ) : <div style={{ color: t.dim, fontSize: 10 }}>هنوز گیفتی نداری، از Store بخر 🛍️</div>}
        </div>
      )}

      {isChannel ? (
        <div className="px-4 pb-4 pt-3 text-center" style={{ borderTop: `1px solid ${t.hair}` }}>
          <div style={{ color: t.dim, fontSize: 10.5 }}>🔒 فقط بنیان‌گذار XZEOUS می‌تواند در این کانال پیام ارسال کند</div>
        </div>
      ) : (
        <div className="p-3 flex gap-2 items-center">
          <button onClick={() => { setAttachOpen(!attachOpen); setEmojiOpen(false); setGiftPickerOpen(false); }} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft }}>📎</button>
          <button onClick={() => { setGiftPickerOpen(!giftPickerOpen); setAttachOpen(false); setEmojiOpen(false); }} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft }}>🎁</button>
          <div className="flex-1 rounded-full flex items-center gap-2 px-3.5 py-2.5" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.03))",
            border: `1px solid ${textFocused ? t.green + "88" : "rgba(255,255,255,.16)"}`,
            boxShadow: textFocused ? `0 0 22px ${t.green}30, inset 0 1px 0 rgba(255,255,255,.25)` : "inset 0 1px 0 rgba(255,255,255,.15)",
            backdropFilter: "blur(22px)",
            transition: "all .35s cubic-bezier(.34,1.56,.64,1)",
          }}>
            <button onClick={() => { setEmojiOpen(!emojiOpen); setAttachOpen(false); setGiftPickerOpen(false); }} style={{ color: t.soft, fontSize: 15, flexShrink: 0 }}>😊</button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onFocus={() => setTextFocused(true)}
              onBlur={() => setTextFocused(false)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="پیام…"
              className="flex-1 bg-transparent outline-none min-w-0"
              style={{ color: t.text, fontSize: 12.5 }}
            />
          </div>
          {text.trim()
            ? <button onClick={send} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90" style={{ background: `linear-gradient(135deg, ${t.green}, ${t.deep})`, color: "#fff", boxShadow: `0 4px 16px ${t.green}44`, transition: "transform .15s" }}>➤</button>
            : <button onClick={sendVoice} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: recording ? "#F17A7A" : `linear-gradient(135deg, ${t.green}, ${t.deep})`, color: "#fff", animation: recording ? "pulseRec 1s infinite" : "none", boxShadow: `0 4px 16px ${t.green}44` }}>🎤</button>}
        </div>
      )}
    </div>
  );
}

function InviteRedeem({ t, onRedeem, redeemed }) {
  const [code, setCode] = useState("");
  if (redeemed) {
    return <div className="mt-3 rounded-xl px-3 py-2 text-center" style={{ background: t.card, border: `1px solid ${t.mint}55`, color: t.mint, fontSize: 10.5, fontWeight: 700 }}>✓ کد دعوت با موفقیت ثبت شد</div>;
  }
  return (
    <div className="flex gap-2 mt-3">
      <div className="flex-1 rounded-xl px-3 py-2" style={{ background: t.bg2, border: `1px solid ${t.hair}` }}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="کد دعوت دوستت رو بزن" className="w-full bg-transparent outline-none" style={{ color: t.text, fontSize: 10.5 }} />
      </div>
      <button onClick={() => onRedeem(code)} className="rounded-xl px-3" style={{ background: t.green, color: "#fff", fontSize: 10, fontWeight: 800 }}>ثبت</button>
    </div>
  );
}

function StoreScreen({ t, coins, onCoins, ownedThemes, equippedTheme, onBuyPlan, onBuyTheme, claimedMissions, onClaimMission, inviteRedeemed, inviteCount, onRedeemInvite, onCopyCode, refStats, ownedStickers, onBuySticker, boxClaimedToday, onOpenBox }) {
  const [tab, setTab] = useState("gifts");
  const tabs = { gifts: "🎁 Gift", premium: "👑 Premium", themes: "🎨 Themes", stickers: "😺 Stickers", missions: "🎯 Missions" };
  return (
    <div className="h-full overflow-y-auto" style={{ background: t.bg }}>
      <div className="px-4 pt-8 pb-3 flex items-center justify-between">
        <div><div style={{ color: t.text, fontSize: 21, fontWeight: 900 }}>Premium Store</div><div style={{ color: t.dim, fontSize: 10, marginTop: 2 }}>چیزهای کوچیک برای خاص‌تر شدن پروفایل ✨</div></div>
        <button onClick={onCoins} className="rounded-full px-3 py-2" style={{ background: `${t.gold}18`, border: `1px solid ${t.gold}55`, color: t.gold, fontSize: 10.5, fontWeight: 800 }}>🪙 {coins.toLocaleString()}</button>
      </div>
      <div className="px-4 flex gap-1.5 overflow-x-auto pb-1">{Object.entries(tabs).map(([k, v]) => <button key={k} onClick={() => setTab(k)} className="rounded-full px-2.5 py-2 flex-shrink-0" style={{ background: tab === k ? t.green : t.card, color: tab === k ? "#fff" : t.soft, border: `1px solid ${tab === k ? t.green : t.hair}`, fontSize: 9.5 }}>{v}</button>)}</div>

      {tab === "gifts" && <div className="px-4 mt-3 grid grid-cols-2 gap-2 pb-6">{GIFTS.map(g => <GiftCard key={g.id} gift={g} t={t} onSend={() => {}} />)}</div>}

      {tab === "premium" && (
        <div className="p-4 pb-6">
          <div className="rounded-[28px] p-5 text-center" style={{ background: `linear-gradient(145deg, ${t.gold}20, ${t.pink}12, ${t.card})`, border: `1px solid ${t.gold}44` }}>
            <div className="text-6xl">👑</div>
            <div style={{ color: t.text, fontSize: 20, fontWeight: 900, marginTop: 8 }}>XZEOUS Premium</div>
            <div style={{ color: t.soft, fontSize: 11, lineHeight: 1.7, marginTop: 5 }}>رینگ اختصاصی، Badge، Giftهای ویژه، تم‌های خاص و قابلیت‌های پروفایل.</div>
          </div>
          <div className="mt-3 space-y-2">
            {PREMIUM_PLANS.map(pl => (
              <button key={pl.id} onClick={() => onBuyPlan(pl)} className="w-full rounded-2xl p-3 text-right relative active:scale-95" style={{ background: t.card, border: `1px solid ${t.gold}44` }}>
                {pl.tag && <span className="absolute -top-2 left-3 rounded-full px-2 py-0.5" style={{ background: t.gold, color: "#1B1407", fontSize: 8.5, fontWeight: 800 }}>{pl.tag}</span>}
                <div className="flex justify-between items-center"><span style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>{pl.label}</span><span style={{ color: t.gold, fontWeight: 900, fontSize: 13 }}>🪙 {pl.coins.toLocaleString()}</span></div>
                <div style={{ color: t.dim, fontSize: 9.5, marginTop: 5, lineHeight: 1.8 }}>{pl.features.join(" · ")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "themes" && (
        <div className="p-4 grid grid-cols-2 gap-2 pb-6">
          {COSMETIC_THEMES.map(th => {
            const owned = ownedThemes.includes(th.name);
            const equipped = equippedTheme === th.name;
            return (
              <button key={th.name} onClick={() => onBuyTheme(th)} className="h-32 rounded-3xl p-3 flex flex-col justify-between text-left relative overflow-hidden active:scale-95" style={{ background: th.grad, border: `2px solid ${equipped ? t.mint : "transparent"}`, boxShadow: equipped ? `0 0 16px ${t.mint}55` : "0 6px 18px rgba(0,0,0,.28)" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.65) 100%)" }} />
                {equipped && <span className="absolute top-2 right-2 rounded-full px-2 py-0.5" style={{ background: t.mint, color: "#04170D", fontSize: 8, fontWeight: 800, zIndex: 1 }}>✓ فعال</span>}
                <span />
                <div className="relative" style={{ zIndex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 12, textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>{th.name}</div>
                  <div className="inline-block mt-1.5 rounded-full px-2 py-0.5" style={{ background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)" }}>
                    <span style={{ color: owned ? "#8CF0B8" : "#FFE49A", fontSize: 10, fontWeight: 800 }}>{owned ? (equipped ? "✓ فعال" : "✓ خریداری‌شده") : `🪙 ${th.cost}`}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === "stickers" && (
        <div className="p-4 grid grid-cols-3 gap-2 pb-6">
          {STICKERS.map(s => {
            const owned = s.free || ownedStickers.includes(s.id);
            return (
              <button key={s.id} onClick={() => onBuySticker(s)} className="rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95" style={{ background: t.card, border: `1px solid ${owned ? t.mint + "55" : t.hair}` }}>
                <span className="text-3xl">{s.icon}</span>
                <span style={{ color: t.text, fontSize: 9.5, fontWeight: 700 }}>{s.name}</span>
                <span style={{ color: owned ? t.mint : t.gold, fontSize: 9, fontWeight: 800 }}>{owned ? "✓ دارم" : `🪙 ${s.cost}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === "missions" && (
        <div className="p-4 pb-6 space-y-3">
          <div className="rounded-3xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${t.gold}20, ${t.pink}0D, ${t.card})`, border: `1px solid ${t.gold}44` }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>🎁 جعبه شانس روزانه</div>
                <div style={{ color: t.dim, fontSize: 9.5, marginTop: 3 }}>هر روز یه‌بار جعبه رو باز کن، شانستو امتحان کن</div>
              </div>
              <button onClick={onOpenBox} disabled={boxClaimedToday} className="rounded-full px-3 py-2 flex-shrink-0" style={{ background: boxClaimedToday ? t.hair : `linear-gradient(135deg,${t.gold},#C98D32)`, color: boxClaimedToday ? t.dim : "#1B1407", fontSize: 10, fontWeight: 800 }}>{boxClaimedToday ? "✓ گرفته شد" : "باز کن 🎁"}</button>
            </div>
          </div>
          <div>
            <div style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>🎯 ماموریت‌های امروز</div>
            <div className="mt-2 space-y-2">
              {MISSIONS.map(m => {
                const claimed = claimedMissions.includes(m.id);
                return (
                  <div key={m.id} className="rounded-2xl p-3 flex items-center justify-between" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <div><div style={{ color: t.text, fontSize: 11.5, fontWeight: 700 }}>{m.title}</div><div style={{ color: t.dim, fontSize: 9.5, marginTop: 2 }}>{m.desc}</div></div>
                    </div>
                    <button onClick={() => onClaimMission(m.id)} disabled={claimed} className="rounded-full px-3 py-1.5" style={{ background: claimed ? t.hair : t.green, color: claimed ? t.dim : "#fff", fontSize: 9.5, fontWeight: 800 }}>{claimed ? "✓ گرفته شد" : `🪙 ${m.reward}`}</button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl p-4" style={{ background: `linear-gradient(145deg, ${t.green}18, ${t.pink}0D, ${t.card})`, border: `1px solid ${t.hair}` }}>
            <div style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>🧑‍🤝‍🧑 دعوت دوستان</div>
            <div style={{ color: t.dim, fontSize: 10, marginTop: 3, lineHeight: 1.8 }}>کد خودت رو بفرست؛ به ازای هر دعوت موفق ۱۵۰ کوین به هردوتون میرسه.</div>
            <div className="rounded-xl px-3 py-2 mt-3 flex items-center justify-between" style={{ background: t.bg2, border: `1px solid ${t.hair}` }}>
              <span style={{ color: t.gold, fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>XZEOUS-7F29A</span>
              <button onClick={onCopyCode} style={{ color: t.soft, fontSize: 10 }}>📋 کپی</button>
            </div>
            <div style={{ color: t.dim, fontSize: 9.5, marginTop: 8 }}>دوستات تا الان: {inviteCount} نفر</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-xl px-2.5 py-2" style={{ background: t.bg2, border: `1px solid ${t.hair}` }}>
                <div style={{ color: t.mint, fontSize: 12, fontWeight: 900 }}>سطح ۱ · {refStats.level1Count} نفر</div>
                <div style={{ color: t.dim, fontSize: 9 }}>🪙 {refStats.level1Earnings.toLocaleString()} کوین سود</div>
              </div>
              <div className="rounded-xl px-2.5 py-2" style={{ background: t.bg2, border: `1px solid ${t.hair}` }}>
                <div style={{ color: t.pink, fontSize: 12, fontWeight: 900 }}>سطح ۲ · {refStats.level2Count} نفر</div>
                <div style={{ color: t.dim, fontSize: 9 }}>🪙 {refStats.level2Earnings.toLocaleString()} کوین سود</div>
              </div>
            </div>
            <div style={{ color: t.dim, fontSize: 9, marginTop: 6, lineHeight: 1.8 }}>زنجیره‌ای: وقتی دوستِ دوستت هم با کد اون عضو بشه، یه سهم کوچیک از سودش خودکار به تو هم می‌رسه.</div>
            <InviteRedeem t={t} onRedeem={onRedeemInvite} redeemed={inviteRedeemed} />
          </div>
        </div>
      )}
    </div>
  );
}

function MarketScreen({ t, coins, ownedGifts, marketListings, onBuyMarket, onListForSale }) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: t.bg }}>
      <div className="px-4 pt-8 pb-3 flex items-center justify-between">
        <div><div style={{ color: t.text, fontSize: 21, fontWeight: 900 }}>🔄 Market</div><div style={{ color: t.dim, fontSize: 10, marginTop: 2 }}>خرید و فروش گیفت بین ممبرها</div></div>
        <span className="rounded-full px-3 py-2" style={{ background: `${t.gold}18`, border: `1px solid ${t.gold}55`, color: t.gold, fontSize: 10.5, fontWeight: 800 }}>🪙 {coins.toLocaleString()}</span>
      </div>
      <div className="p-4 pb-6 space-y-3">
        {ownedGifts.length > 0 && (
          <div>
            <div style={{ color: t.soft, fontSize: 10, fontWeight: 700, margin: "2px 2px 6px" }}>گیفت‌های تو (برای فروش بزن)</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ownedGifts.map((g, i) => (
                <button key={i} onClick={() => onListForSale(g)} className="flex-shrink-0 rounded-2xl p-2 flex flex-col items-center" style={{ width: 66, background: t.card, border: `1px solid ${g.glow}44` }}>
                  <span className="text-2xl">{g.icon}</span>
                  <span style={{ color: t.soft, fontSize: 8, marginTop: 2, textAlign: "center" }}>{g.name}</span>
                  <span style={{ color: t.gold, fontSize: 8, fontWeight: 800 }}>فروش</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <div style={{ color: t.soft, fontSize: 10, fontWeight: 700, margin: "2px" }}>آگهی‌های فعال بازار</div>
          {marketListings.map(l => (
            <div key={l.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: t.card, border: `1px solid ${l.gift.glow}44` }}>
              <span className="text-3xl">{l.gift.icon}</span>
              <div className="flex-1">
                <div style={{ color: t.text, fontSize: 11.5, fontWeight: 800 }}>{l.gift.name}</div>
                <div style={{ color: t.dim, fontSize: 9.5, marginTop: 2 }}>فروشنده: {l.icon} {l.seller}</div>
              </div>
              <button onClick={() => onBuyMarket(l)} className="rounded-full px-3 py-1.5" style={{ background: t.green, color: "#fff", fontSize: 10, fontWeight: 800 }}>🪙 {l.price.toLocaleString()}</button>
            </div>
          ))}
          {marketListings.length === 0 && <div style={{ color: t.dim, fontSize: 10.5, textAlign: "center", padding: "16px 0" }}>فعلاً آگهی‌ای نیست</div>}
        </div>
      </div>
    </div>
  );
}

function Settings({ t, profileMeta, setProfileMeta }) {
  const [section, setSection] = useState(null);
  const photoRef = useRef(null);
  const onPhoto = e => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    setProfileMeta(m => ({ ...m, photo: URL.createObjectURL(file) }));
    e.target.value = "";
  };
  const items = ["Account", "Privacy & Security", "Notifications", "Appearance", "Storage", "Premium", "About XZEOUS"];
  const icons = ["👤", "🔒", "🔔", "🎨", "💾", "👑", "💚"];

  if (section) {
    return (
      <div className="h-full overflow-y-auto px-4 pt-8 pb-6" style={{ background: t.bg }}>
        <button onClick={() => setSection(null)} className="flex items-center gap-2 mb-4" style={{ color: t.soft }}>
          <span style={{ fontSize: 14 }}>←</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>بازگشت</span>
        </button>
        <div style={{ color: t.text, fontWeight: 900, fontSize: 18 }}>{icons[items.indexOf(section)]} {section}</div>

        <div className="mt-4 space-y-3">
          {section === "Account" && (
            <>
              <div className="p-3 rounded-2xl flex items-center gap-3" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
                <div className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ width: 54, height: 54, background: `linear-gradient(135deg, ${t.green}, ${t.deep})` }}>
                  {profileMeta.photo ? <img src={profileMeta.photo} alt="" className="w-full h-full object-cover" /> : <span style={{ color: "#fff", fontWeight: 900 }}>XZ</span>}
                </div>
                <button onClick={() => photoRef.current && photoRef.current.click()} className="rounded-xl px-3 py-1.5" style={{ background: t.hair, color: t.soft, fontSize: 10, fontWeight: 700 }}>تغییر عکس پروفایل</button>
                <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              </div>
              <div className="p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
                <div style={{ color: t.soft, fontSize: 10, marginBottom: 8 }}>نام</div>
                <input type="text" value={profileMeta.name} onChange={e => setProfileMeta(m => ({ ...m, name: e.target.value }))} className="w-full px-2 py-1 rounded" style={{ background: t.bg, color: t.text, fontSize: 11, border: `1px solid ${t.hair}` }} />
              </div>
              <div className="p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
                <div style={{ color: t.soft, fontSize: 10, marginBottom: 8 }}>نام کاربری</div>
                <input type="text" value={profileMeta.handle} onChange={e => setProfileMeta(m => ({ ...m, handle: e.target.value }))} className="w-full px-2 py-1 rounded" style={{ background: t.bg, color: t.text, fontSize: 11, border: `1px solid ${t.hair}` }} />
              </div>
              <div className="p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
                <div style={{ color: t.soft, fontSize: 10, marginBottom: 8 }}>بیو</div>
                <textarea value={profileMeta.bio} onChange={e => setProfileMeta(m => ({ ...m, bio: e.target.value }))} rows={2} className="w-full px-2 py-1 rounded resize-none" style={{ background: t.bg, color: t.text, fontSize: 11, border: `1px solid ${t.hair}` }} />
              </div>
              <button className="w-full rounded-2xl py-2" style={{ background: t.green, color: "#fff", fontWeight: 800, fontSize: 11 }}>ذخیره تغییرات</button>
            </>
          )}

          {section === "Privacy & Security" && (
            <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
              <span style={{ color: t.text, fontSize: 11, fontWeight: 700 }}>احراز هویت دو مرحله‌ای</span>
              <div className="relative rounded-full" style={{ width: 38, height: 22, background: t.hair }}>
                <div className="absolute rounded-full" style={{ width: 18, height: 18, top: 2, left: 2, background: "#fff" }} />
              </div>
            </div>
          )}

          {section === "Notifications" && (
            <>
              {["پیام‌های جدید", "منشن‌ها", "گیفت‌ها"].map((label, i) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
                  <span style={{ color: t.text, fontSize: 11, fontWeight: 700 }}>{label}</span>
                  <div className="relative rounded-full" style={{ width: 38, height: 22, background: t.green }}>
                    <div className="absolute rounded-full" style={{ width: 18, height: 18, top: 2, left: 18, background: "#fff" }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {section === "Appearance" && (
            <div className="p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
              <div style={{ color: t.soft, fontSize: 10, marginBottom: 8 }}>اندازه فونت</div>
              <input type="range" min="10" max="16" defaultValue="12" className="w-full" />
            </div>
          )}

          {section === "Storage" && (
            <div className="p-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
              <div style={{ color: t.text, fontSize: 11, fontWeight: 700 }}>حجم کش: ۲۳۴ مگابایت</div>
              <button className="w-full rounded-2xl py-2 mt-3" style={{ background: t.hair, color: t.soft, fontWeight: 700, fontSize: 10.5 }}>پاک کردن کش</button>
            </div>
          )}

          {section === "Premium" && (
            <div className="p-3 rounded-2xl text-center" style={{ background: `${t.gold}15`, border: `1px solid ${t.gold}44` }}>
              <div style={{ fontSize: 26 }}>👑</div>
              <div style={{ color: t.gold, fontWeight: 800, fontSize: 12, marginTop: 6 }}>عضویت Premium فعال است</div>
            </div>
          )}

          {section === "About XZEOUS" && (
            <div className="text-center">
              <div style={{ fontSize: 28, margin: "20px 0" }}>💚</div>
              <div style={{ color: t.text, fontWeight: 800, fontSize: 12 }}>XZEOUS v1.0.0</div>
              <div style={{ color: t.dim, fontSize: 10, marginTop: 8, lineHeight: 1.8 }}>ساخته شده با ❤️ برای دوستان</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-8 pb-6" style={{ background: t.bg }}>
      <div style={{ color: t.text, fontWeight: 900, fontSize: 21 }}>Settings</div>
      {items.map((x, i) => (
        <button key={x} onClick={() => setSection(x)} className="mt-2 w-full rounded-2xl px-4 py-3 flex justify-between items-center active:scale-[.99]" style={{ background: t.card, border: `1px solid ${t.hair}` }}>
          <span style={{ color: t.text, fontSize: 12, fontWeight: 650 }}>{icons[i]} {x}</span>
          <span style={{ color: t.dim, fontSize: 14 }}>›</span>
        </button>
      ))}
    </div>
  );
}

function Dock({ t, active, setActive }) {
  return (
    <div className="px-3 pb-3 pt-1">
      <div className="relative flex rounded-full p-1" style={{ background: "rgba(255,255,255,.065)", border: `1px solid ${t.hair}`, backdropFilter: "blur(20px)" }}>
        <div className="absolute top-1 bottom-1 rounded-full" style={{ left: `calc(${active * (100 / TABS.length)}% + 4px)`, width: `calc(${100 / TABS.length}% - 8px)`, background: `linear-gradient(135deg,${t.green},${t.deep})`, boxShadow: `0 0 18px ${t.green}55`, transition: "left .4s cubic-bezier(.34,1.56,.64,1)" }} />
        {TABS.map(([icon, label], i) => (
          <button key={label} onClick={() => setActive(i)} className="relative flex-1 py-2 flex flex-col items-center">
            <span style={{ fontSize: 15, opacity: active === i ? 1 : .55 }}>{icon}</span>
            <span style={{ fontSize: 8, color: active === i ? "#fff" : t.dim, fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("dark");
  const [tab, setTab] = useState(0);
  const [premium, setPremium] = useState(true);
  const [coins, setCoins] = useState(4250);
  const [ownedGifts, setOwnedGifts] = useState(GIFTS.slice(0, 2));
  const [ownedThemes, setOwnedThemes] = useState([]);
  const [equippedTheme, setEquippedTheme] = useState(null);
  const [claimedMissions, setClaimedMissions] = useState([]);
  const [inviteRedeemed, setInviteRedeemed] = useState(false);
  const [inviteCount, setInviteCount] = useState(3);
  const [chat, setChat] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  // فیچرهای آپدیت جدید
  const [profileMeta, setProfileMeta] = useState({ name: ME.name, handle: ME.handle, bio: ME.bio, birthday: ME.birthday, photo: null });
  // گیفت‌هایی که کاربر برای نمایش تو Showcase پروفایلش انتخاب کرده (پیش‌فرض: ۴ تای اول گیفت‌های مالکش)
  const [showcaseIds, setShowcaseIds] = useState(GIFTS.slice(0, 2).map(g => g.id));
  const [premiumMonths, setPremiumMonths] = useState(4);
  const [ownedStickers, setOwnedStickers] = useState([]);
  const [marketListings, setMarketListings] = useState(INITIAL_MARKET);
  const [boxClaimedToday, setBoxClaimedToday] = useState(false);
  const [monthlyClaimed, setMonthlyClaimed] = useState(false);
  const [refStats, setRefStats] = useState({ level1Count: 3, level1Earnings: 450, level2Count: 2, level2Earnings: 90 });
const [user, setUser] = useState(null);
const [loginEmail, setLoginEmail] = useState("");
const [loginPassword, setLoginPassword] = useState("");

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user ?? null);
  });
}, []);

const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    return false;
  }

  setUser(data.user);
  return true;
};
  const baseTheme = THEMES[mode];
  const equippedThemeObj = COSMETIC_THEMES.find(x => x.name === equippedTheme) || null;
  // اگه یه تم کاسمتیک equip شده باشه، رنگ green/deep پیش‌فرض اپ با accent همون تم عوض میشه
  // این باعث میشه چت، داک، حباب پیام و همه‌جای اپ رنگ تم رو بگیرن.
  const t = equippedThemeObj
    ? { ...baseTheme, green: equippedThemeObj.accent, deep: equippedThemeObj.accentDeep }
    : baseTheme;

  const vipTier = getVipTier(premium ? premiumMonths : 0);
  const isBirthday = (() => {
    const now = new Date();
    const [m, d] = (profileMeta.birthday || ME.birthday).split("-").map(Number);
    return now.getMonth() + 1 === m && now.getDate() === d;
  })();
  const leaderboardTop = LEADERBOARD[0].name === ME.name;

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const buyPremiumPlan = plan => {
    if (coins < plan.coins) { showToast("🪙 سکه‌ت کافی نیست"); return; }
    setCoins(c => c - plan.coins); setPremium(true); setModal(null);
    showToast(`✅ پلن ${plan.label} فعال شد`);
  };
  const buyTheme = theme => {
    if (ownedThemes.includes(theme.name)) { setEquippedTheme(theme.name); showToast(`🎨 تم ${theme.name} فعال شد`); return; }
    if (coins < theme.cost) { showToast("🪙 سکه‌ت کافی نیست"); return; }
    setCoins(c => c - theme.cost); setOwnedThemes(o => [...o, theme.name]); setEquippedTheme(theme.name);
    showToast(`🎉 تم ${theme.name} خریداری و اعمال شد`);
  };
  const claimMission = id => {
    const m = MISSIONS.find(x => x.id === id);
    if (!m || claimedMissions.includes(id)) return;
    setClaimedMissions(prev => [...prev, id]);
    setCoins(c => c + m.reward);
    showToast(`🎯 ${m.reward} کوین گرفتی!`);
  };
  const redeemInvite = code => {
    if (!code.trim() || inviteRedeemed) return;
    setInviteRedeemed(true);
    setCoins(c => c + 150);
    setInviteCount(c => c + 1);
    // رفرال زنجیره‌ای: سود سطح ۱ مستقیم + یه سهم کوچیک خودکار از زیرمجموعه‌ی زیرمجموعه (سطح ۲)
    setRefStats(r => ({ level1Count: r.level1Count + 1, level1Earnings: r.level1Earnings + 150, level2Count: r.level2Count + 1, level2Earnings: r.level2Earnings + 45 }));
    showToast("🎉 ۱۵۰ کوین برای تو و دوستت اضافه شد!");
  };
  const copyCode = () => {
    try { navigator.clipboard.writeText("XZEOUS-7F29A"); } catch (e) {}
    showToast("📋 کد کپی شد");
  };

  const buySticker = s => {
    if (s.free || ownedStickers.includes(s.id)) return;
    if (coins < s.cost) { showToast("🪙 سکه‌ت کافی نیست"); return; }
    setCoins(c => c - s.cost); setOwnedStickers(o => [...o, s.id]);
    showToast(`😺 استیکر ${s.name} خریداری شد`);
  };
  const listForSale = g => {
    const price = Math.round(g.price * 0.85);
    setOwnedGifts(prev => { const idx = prev.findIndex(x => x.id === g.id); if (idx === -1) return prev; const next = [...prev]; next.splice(idx, 1); return next; });
    setMarketListings(prev => [{ id: "m" + Date.now(), gift: g, price, seller: profileMeta.name, icon: "XZ" }, ...prev]);
    showToast(`🔄 ${g.name} تو بازار برای فروش گذاشته شد`);
  };
  const buyMarket = listing => {
    if (coins < listing.price) { showToast("🪙 سکه‌ت کافی نیست"); return; }
    setCoins(c => c - listing.price);
    setOwnedGifts(prev => [listing.gift, ...prev]);
    setMarketListings(prev => prev.filter(x => x.id !== listing.id));
    showToast(`✅ ${listing.gift.name} از ${listing.seller} خریداری شد`);
  };
  const openBox = () => {
    if (boxClaimedToday) return;
    setBoxClaimedToday(true);
    const wins = LOOTBOX_TABLE.filter(item => Math.random() < item.chance);
    if (wins.length === 0) { showToast("😅 امروز چیزی نیفتاد، فردا دوباره امتحان کن"); return; }
    let coinGain = 0;
    const labels = [];
    wins.forEach(w => {
      labels.push(w.label);
      if (w.coins) coinGain += w.coins;
      if (w.id === "theme") {
        const free = COSMETIC_THEMES[Math.floor(Math.random() * COSMETIC_THEMES.length)];
        setOwnedThemes(o => o.includes(free.name) ? o : [...o, free.name]);
      }
      if (w.id === "knife") setOwnedGifts(prev => [GIFTS.find(g => g.name === "چاقو"), ...prev]);
      if (w.id === "teddy") setOwnedGifts(prev => [GIFTS.find(g => g.name === "خرس تدی"), ...prev]);
      if (w.id === "premium1m") { setPremium(true); setPremiumMonths(m => m + 1); }
    });
    if (coinGain) setCoins(c => c + coinGain);
    showToast(`🎁 گرفتی: ${labels.join(" · ")}`);
  };
  const claimMonthly = () => {
    if (!leaderboardTop || monthlyClaimed) return;
    setMonthlyClaimed(true); setCoins(c => c + 100);
    showToast("🏆 جایزه ماهانه لیدربورد: ۱۰۰ کوین گرفتی!");
  };

  const screens = [
    <ChatsScreen t={t} mode={mode} onOpenChat={setChat} onOpenProfile={setViewProfile} />,
    <StoreScreen
      t={t} coins={coins} onCoins={() => setModal("coins")}
      ownedThemes={ownedThemes} equippedTheme={equippedTheme} onBuyPlan={buyPremiumPlan} onBuyTheme={buyTheme}
      claimedMissions={claimedMissions} onClaimMission={claimMission}
      inviteRedeemed={inviteRedeemed} inviteCount={inviteCount} onRedeemInvite={redeemInvite} onCopyCode={copyCode}
      refStats={refStats} ownedStickers={ownedStickers} onBuySticker={buySticker}
      boxClaimedToday={boxClaimedToday} onOpenBox={openBox}
    />,
    <MarketScreen t={t} coins={coins} ownedGifts={ownedGifts} marketListings={marketListings} onBuyMarket={buyMarket} onListForSale={listForSale} />,
    <ProfileScreen t={t} premium={premium} coins={coins} setCoins={setCoins} ownedGifts={ownedGifts} setOwnedGifts={setOwnedGifts} onPremium={() => setModal("premium")} equippedThemeObj={equippedThemeObj}
      profileMeta={profileMeta} setProfileMeta={setProfileMeta} vipTier={vipTier} isBirthday={isBirthday} leaderboardTop={leaderboardTop} onClaimMonthly={claimMonthly} monthlyClaimed={monthlyClaimed}
      showcaseIds={showcaseIds} setShowcaseIds={setShowcaseIds}
    />,
    <Settings t={t} profileMeta={profileMeta} setProfileMeta={setProfileMeta} />,
  ];
if (!user) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#070A09", color: "#F5F7F4" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "rgba(255,255,255,.055)",
          border: "1px solid rgba(255,255,255,.09)",
        }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👑</div>
          <h1 className="text-2xl font-bold">XZEOUS</h1>
          <p className="text-sm opacity-60 mt-1">Welcome back</p>
        </div>

        <input
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-2xl px-4 py-3 mb-3 outline-none"
          style={{
            background: "rgba(255,255,255,.07)",
            color: "#fff",
          }}
        />

        <input
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full rounded-2xl px-4 py-3 mb-4 outline-none"
          style={{
            background: "rgba(255,255,255,.07)",
            color: "#fff",
          }}
        />

        <button
          onClick={() => loginUser(loginEmail, loginPassword)}
          className="w-full rounded-2xl py-3 font-bold"
          style={{
            background: "#37B878",
            color: "#06140D",
          }}
        >
          ورود به XZEOUS
        </button>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 py-6" style={{ background: baseTheme.outer }}>
      <div className="flex gap-2 flex-wrap justify-center">
        <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="px-3 py-1.5 rounded-full" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft, fontSize: 10 }}>{mode === "dark" ? "🌸 Light Mode" : "🌙 Dark Mode"}</button>
        <button onClick={() => setPremium(!premium)} className="px-3 py-1.5 rounded-full" style={{ background: t.card, border: `1px solid ${t.hair}`, color: t.soft, fontSize: 10 }}>{premium ? "👑 Premium ON" : "✨ Premium OFF"}</button>
      </div>
      <div className="rounded-[2.7rem] overflow-hidden relative" style={{ width: 350, height: 720, border: `8px solid ${mode === "dark" ? "#111" : "#E7C5D2"}`, boxShadow: "0 30px 100px rgba(0,0,0,.5)" }}>
        {viewProfile ? (
          viewProfile.type === "channel"
            ? <ChannelProfileScreen t={t} chat={viewProfile} onBack={() => setViewProfile(null)} />
            : <MemberProfileScreen t={t} chat={viewProfile} onBack={() => setViewProfile(null)} />
        ) : chat ? (
          <ChatScreen t={t} chat={chat} onBack={() => setChat(null)} premium={premium} ownedGifts={ownedGifts} setOwnedGifts={setOwnedGifts} onOpenProfile={setViewProfile} />
        ) : (
          <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-hidden relative">
              <div key={tab} style={{ height: "100%", animation: "screenIn .3s ease" }}>{screens[tab]}</div>
            </div>
            <Dock t={t} active={tab} setActive={setTab} />
          </div>
        )}
        {toast && <div className="absolute left-1/2 bottom-24 rounded-full px-4 py-2" style={{ transform: "translateX(-50%)", background: t.bg2, border: `1px solid ${t.hair}`, color: t.text, fontSize: 11, fontWeight: 700, zIndex: 40, boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>{toast}</div>}
      </div>
      {modal === "premium" && <PremiumModal t={t} onClose={() => setModal(null)} onBuyPlan={buyPremiumPlan} />}
      {modal === "coins" && <CoinModal t={t} onClose={() => setModal(null)} />}
      <style>{`
        @keyframes floatGift{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-7px) rotate(3deg)}}
        @keyframes crownFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
        @keyframes ringSpin{to{transform:rotate(360deg)}}
        @keyframes blob{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,18px) scale(1.1)}}
        @keyframes pulseRec{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        @keyframes screenIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes boxShake{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
        @keyframes unboxPop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}
        @keyframes sparkle{0%{transform:translateY(0) scale(.5);opacity:1}100%{transform:translateY(-60px) scale(1.2);opacity:0}}
        @keyframes bubbleIn{0%{opacity:0;transform:scale(.85) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes menuPop{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}
        @keyframes orbitSpin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

export default App;
