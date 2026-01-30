# Home Helper Hub

A comprehensive household management web application with tasks, reminders, shopping, whiteboard, arrival alarms, and meal planning.

![Home Helper Hub](https://placehold.co/600x300/3b82f6/white?text=Home+Helper+Hub)

## Features

### 1. Task Management (Weekly & Monthly)
- Priority levels (High/Medium/Low)
- Auto-calculated next due dates
- Last 3 completion timestamps visible on each task
- Photo/Note attachments on completion
- 5-minute undo window with countdown
- Status tracking: Overdue, Due Today, Upcoming, OK

### 2. Multi-Helper Support
- Owner (Madam/Sir) and Helper roles
- Flexible task assignment (all helpers or specific)
- Owner can manage users, tasks, and settings

### 3. Reminders Page
- Grouped by: Overdue, Due Today, Upcoming
- Sorted by priority within each group

### 4. Shopping List
- Pre-seeded catalog (Laundry/Cleaning, Kitchen/Pantry, Toiletries, Baby/Child)
- Add from catalog or custom items with photos
- Toggle bought/to-buy status
- Optional assignment to helpers
- Add new items to catalog (Owner only)

### 5. Whiteboard
- Create/edit posts with emoji support
- Pin important posts
- 15-minute edit window for non-owners
- Owner can edit anytime

### 6. Meal Planning (Hybrid Mode)
- Weekly plan editor (Mon-Sun) with photo tiles
- Daily override for Today/Tomorrow
- Add custom meals with photos
- Helper sees read-only view

### 7. Arrival Alarm
- One-off and recurring schedules
- Lead time configuration
- Default notify ALL helpers
- Alarm modal with Acknowledge/Snooze/Mute

### 8. History
- All completion logs with filters
- Photo thumbnails
- Owner can delete records

### 9. Theme & Settings
- 6 preset themes (Classic Light/Dark, Ocean Blue, Mint Green, Warm Sand, Lavender)
- Custom accent color picker
- Light/Dark/System mode
- Font size (Normal/Large)
- Bilingual: English + Traditional Chinese
- Alarm sound/volume settings

## Demo Accounts

All accounts use password: `password`

- **Madam** (Owner): `madam@home.com`
- **Sir** (Owner): `sir@home.com`
- **Helper**: `helper@home.com`

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- IndexedDB for local storage
- i18n for internationalization
- Asia/Hong_Kong timezone
- Date format: dd-MMM-yy HH:mm

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/home-helper-hub.git
cd home-helper-hub

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Deployment

The `dist` folder contains the built application ready for deployment to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/        # shadcn/ui components
│   │   ├── AlarmModal.tsx
│   │   └── BottomNav.tsx
│   ├── contexts/      # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── db/            # IndexedDB database
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── locales/       # i18n translations
│   │   ├── en.json
│   │   ├── zh-Hant.json
│   │   └── i18n.ts
│   ├── pages/         # Page components
│   │   ├── LoginPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── RemindersPage.tsx
│   │   ├── ShoppingPage.tsx
│   │   ├── WhiteboardPage.tsx
│   │   ├── MealsPage.tsx
│   │   ├── HistoryPage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/         # TypeScript types
│   │   └── index.ts
│   ├── utils/         # Utility functions
│   │   ├── date.ts
│   │   └── taskHelpers.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── public/
│   └── assets/
│       └── meals/     # Meal photos
├── dist/              # Build output
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [date-fns](https://date-fns.org/) for date manipulation
- [i18next](https://www.i18next.com/) for internationalization
