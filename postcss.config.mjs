/** Tailwind CSS v4 uses a PostCSS plugin instead of a `tailwind.config.js`; all
 * design tokens live in `src/app/globals.css` under `@theme` (see DESIGN.md). */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
