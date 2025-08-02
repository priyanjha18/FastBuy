# 🛒 Full Stack E-Commerce Application (Node.js + Express + MongoDB)

A production-grade e-commerce platform built with **Node.js** and **Express.js**, following the **MVP architecture** and powered by **MongoDB Atlas**. It features a secure login system, admin dashboard, product/cart management, payment integration with Stripe, and PDF invoice generation.

---

## 🚀 Features

- 🧱 Built with **Express.js** and structured using **MVP architecture**
- 🖼️ **EJS** templating engine used for dynamic views
- 🌐 **MongoDB Atlas** with **Mongoose ORM** for schema-based data modeling
- 🧑‍💻 Admin dashboard shows users, their products, carts, and orders
- 🔐 Authentication using **express-session**, protected by **CSRF tokens**
- 🔑 Password hashing with **bcryptjs**
- 📧 Password reset via **nodemailer** using secure crypto tokens
- 💳 Payment processing with **Stripe.js**
- 🧾 Invoice generation with **PDFKit**
- ✅ Input validation using **express-validator**
- 💬 Flash messaging with **express-flash**
- 🔒 Only authenticated users can create/edit their own products

---

## 🧰 Tech Stack

| Purpose        | Technology                     |
|----------------|--------------------------------|
| Server         | Node.js + Express.js           |
| Frontend Views | EJS Templating Engine          |
| DB             | MongoDB Atlas + Mongoose       |
| Auth           | express-session, bcryptjs      |
| Security       | csurf, express-validator       |
| Flash Messages | express-flash                  |
| Email          | Nodemailer + crypto            |
| Payments       | Stripe.js                      |
| Invoicing      | PDFKit                         |

---

## 📁 Folder Structure

├── controllers/ # Handles route logic (products, auth, admin, cart)
├── models/ # Mongoose schemas (User, Product, Cart, Order)
├── routes/ # Express routers
├── views/ # EJS templates
├── public/ # Static assets (CSS, JS, images)
├── utils/ # PDF generation and helper logic
├── app.js # Main application entry point
├── .env # Environment variables

yaml
Copy code

---

## 📦 MongoDB Models

- **User Model**  
  ↳ Connected to Cart, Products, and Orders

- **Product Model**  
  ↳ Created by specific users, only editable by owner

- **Cart Model**  
  ↳ Stores product references with quantity

- **Order Model**  
  ↳ Created after payment, linked to user

---

## 🔧 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/ecommerce-app.git
cd ecommerce-app
npm install
2. Configure Environment Variables
Create a .env file in the root directory:

env
Copy code
MONGODB_URI=your_mongodb_atlas_uri
STRIPE_SECRET_KEY=your_stripe_secret_key
SESSION_SECRET=your_random_session_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
3. Run the App
bash
Copy code
npm start
App will run locally at: http://localhost:3000

📸 Core Screenshots (Optional)
🛍️ Product listing page

🛒 Cart interface

🔐 Login / signup flow

🧾 Invoice PDF preview

🧑‍💼 Admin dashboard overview

Add these to show off your UI

🔒 Security Summary
✅ CSRF tokens on every form

✅ Password hashing with bcryptjs

✅ Email verification & reset via Nodemailer

✅ Users can only manage their own products

✅ Session data stored securely

🧾 Invoicing System
After successful checkout:

An invoice is generated using PDFKit

Stored and downloadable for users

Includes product summary, user info, and Stripe confirmation

🔮 Future Plans
🖼️ Image uploads for products (e.g., using Multer)

📦 Pagination, filtering & category system

📊 Admin analytics dashboard

🛠️ Convert to RESTful API + React frontend

📱 Mobile-friendly UI with Bootstrap/Tailwind

👤 Author
Built with 💻, ☕, and 🔥 by Priyan Jha and with learning of academind

📄 License
This project is open-source under the MIT License

yaml
Copy code

---






