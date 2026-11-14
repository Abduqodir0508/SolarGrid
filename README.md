# ☀️ SolarGrid — 2D/3D Tom Konstruktori va Quyosh Kalkulyatori

Quyosh panellari o'rnatuvchi ustalar, muhandislar va kompaniyalar uchun mo'ljallangan yuqori aniqlikdagi 2D/3D tom konstruktori va rentabellik (ROI) kalkulyatori.

## 🚀 Asosiy Imkoniyatlar

1. **📐 Faqat Tom Konstruktori va Kompas:**
   - Tomning eni va bo'yini santimetrgacha kiritish (1 metrdan 100 metrgacha).
   - Qiyalik burchagi (0° tekis tomdan 60° gacha slayder).
   - Kompas yo'nalishi (Janub, Sharq, G'arb, Shimol).
   - O'zbekiston kengligi uchun kalibrlangan avtomatik fotovoltaik unumdorlik indeksi (masalan: Janub, 32° — 99.2% maksimal unumdorlik).

2. **📱 Quyosh Panellari Katalogi va Mobile-First UX:**
   - Real o'lchamdagi standart panellar:
     - **LONGi Hi-MO 6 Explorer (550W)** — 227.8 × 113.4 sm, qalinligi 3.5 sm
     - **Jinko Tiger Neo (580W)** — 227.8 × 113.4 sm, qalinligi 3.5 sm
     - **Trina Vertex S Mono (430W)** — 176.2 × 113.4 sm, qalinligi 3.0 sm
     - **Canadian Solar (660W)**
     - Maxsus yangi panel qo'shish imkoniyati.
   - Barmoq / sichqoncha bilan Drag & Drop va Touch Move.
   - Tanlangan panelni 90° ga aylantirish (portret / peyzaj) va o'chirish.

3. **📏 "Aqlli Chizg'ich" (Smart Ruler & Magnetic Snap):**
   - Jonli chiziqlar: panelning 4 ta chetidan tom devorlarigacha masofa santimetrda ko'rinib turadi (`Chapdan: 145 sm | Tepadan: 80 sm...`).
   - Magnit yopishish (Snap): panellar bir-biriga yaqinlashganda shamol va karkas uchun avtomatik **2 sm** masofa qoldirib yopishadi.
   - Panel tom chegarasidan chiqib ketsa yoki ustma-ust tushsa yonib-o'chuvchi qizil ogohlantirish.

4. **✨ AI Avto-Joylashtirish (Smart Layout Generator):**
   - **Maksimal sig'im:** Tomga maksimal sig'adigan panellarni simmetrik to'ldirish.
   - **Markazda 1 qator:** Tom qoq o'rtasida yonma-yon tekis qator.
   - **Markazda 2x2 / 2x3 blok:** Markazlashtirilgan to'rtburchak blok.
   - **Tepaga tekislangan:** Tepadan boshlab tartibli terish.

5. **🌐 2D / 3D Rejim va Quyosh/Soya Simulyatsiyasi:**
   - **2D Rejim:** Yuqoridan muhandislik koordinata to'ri (Grid), aniq santimetr chizg'ichlar, Zoom va Pan.
   - **3D Rejim (Three.js):** Tom tanlangan burchak ostida qiyalikda, panellar real 3.5 sm qalinlikda va alyuminiy montaj relslari (karkas) ustida. 360° erkin aylantirish (OrbitControls).
   - **Quyosh va Soya Slayderi:** Soat 06:00 dan 20:00 gacha va Yoz / Qish / Bahor fasllari bo'yicha nurning tushish burchagi va real vaqtda harakatlanuvchi soya.

6. **📄 Usta uchun Montaj Sxemasi va Mijoz uchun Smeta (Print / PDF):**
   - Usta uchun montaj jadvali: har bir qatorning tepa, chap, o'ng chetidan masofalari (sm).
   - Mijoz uchun tijoriy taklif: jami quvvat (kVt), kunlik/oylik/yillik kVt·soat, xarajat summasi, oylik tejamkorlik va **ROI (necha yilda o'zini oqlashi)**.
   - Tugma orqali to'g'ridan-to'g'ri chop etish yoki PDF formatda saqlash (`window.print()`).

7. **🔒 0 So'm Xarajat, Og'ir Bazasiz va Xavfsiz:**
   - Barcha hisob-kitoblar brauzerda toza matematika va geometriya bilan ishlaydi.
   - Loyihalarni saqlash: `localStorage`.
   - Loyihalarni ulashish: URL Base64 state (`#share=...`).
   - XSS himoyasi va qat'iy input validatsiya.

## 🛠 O'rnatish va Ishga Tushirish

```bash
# Kutubxonalarni o'rnatish
npm install

# Dasturni ishga tushirish (Dev server)
npm run dev

# Ishlab chiqarish versiyasini yig'ish (Build)
npm run build
```

Brauzerda oching: [http://localhost:3000](http://localhost:3000)
