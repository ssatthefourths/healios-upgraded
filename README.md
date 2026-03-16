# Healios - Premium Wellness & Vitality

Healios is a luxury wellness brand dedicated to providing high-quality, scientifically-backed supplements and health solutions. This repository contains the source code for the Healios e-commerce experience, built with a focus on minimal aesthetics ("Atelier" style), performance, and user-centric design.

## 🌿 Technical Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Local Development

1. **Clone the repository**:
   ```sh
   git clone https://github.com/ssatthefourths/healios-upgraded.git
   cd healios-upgraded
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```sh
   npm run dev
   ```
   The application will be available at `http://localhost:8080`.

## 📁 Project Structure

- `src/components`: Reusable UI components organized by feature.
- `src/pages`: Application pages and routing.
- `src/hooks`: Custom React hooks for state and side-effects.
- `src/contexts`: React Contexts for global state (Cart, Auth, Currency).
- `public`: Static assets and product imagery.
- `docs`: Internal documentation, setup guides, and project history.

## ☁️ Deployment

The project is optimized for deployment on **Cloudflare Pages**. For detailed instructions on setting up Cloudflare, please refer to [docs/cloudflare-setup.md](docs/cloudflare-setup.md).

---

© 2026 Healios Wellness. All rights reserved.
