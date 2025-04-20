# VaxTrak 💉

VaxTrak is a web-based vaccination appointment booking system that allows users to register family members, view vaccine recommendations based on age, and find suitable hospitals (categorized as free or paid) for appointments.

## 🔧 Features

- 👨‍👩‍👧‍👦 Register multiple family members
- 🎯 Vaccine recommendations based on age:
  - Covishield/Covaxin for age > 18
  - Polio for age < 10
- 🏥 View hospital listings (Free & Paid)
- 📅 Book appointments seamlessly
- 💬 Chatbot powered by Gemini API
- 🧳 Travel vaccine advisory
- ❤️ Donate vaccines to underprivileged users
- 📰 Live health & vaccine news (via GNews API)
- 📊 Vaccine data visualization using Chart API

## 🔄 How It Works

1. Users register family members with age.
2. The system recommends vaccines based on age.
3. Hospital listings are filtered based on vaccine availability.
4. An interactive Leaflet map shows nearby hospitals.
5. Users book appointments through a simple UI.
6. A chatbot (Gemini API) helps answer user queries.
7. Users can get travel-related vaccine suggestions.
8. Live news updates are fetched via the GNews API.
9. Visual stats/charts are shown using Chart API.

## 🌟 Future Enhancements

- 📬 Email/SMS reminders for upcoming appointments
- 🧑‍⚕️ Hospital admin dashboard for slot and stock control
- 🌍 Geolocation-based hospital suggestions
- 🔐 User authentication with OTP or Google OAuth
- 🏆 User badges/rewards for regular vaccination

## 🛠 Tech Stack

- **Frontend:** HTML, Tailwind CSS, JavaScript, EJS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **APIs Used:**
  - **GNews API** – for real-time health news
  - **Gemini API** – for chatbot interaction
  - **Chart API** – for analytics/visuals

## 🚀 Installation

```bash
git clone https://github.com/yourusername/vaxtrak.git
cd vaxtrak
npm install
npm start
