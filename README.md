# bridge.ai

A cursor-snapping Chrome extension with a companion Next.js demo app.

## Architecture

- Next.js app (demo site) in `src/`
- Chrome Extension (MV3) in `extension/`
- Optional API routes in `src/app/api/` for embeddings and Stripe checkout

## Tech Stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS, Framer Motion, Shadcn/UI, Eldora UI
- Stripe SDK (server-side)
- Chrome Extension Manifest V3

## Prerequisites

Install Git and Node.js (18+). If you don’t have them yet:

1. Install Git from `https://git-scm.com/downloads`
2. Install Node.js (LTS) from `https://nodejs.org/`
3. Reopen your terminal so `git` and `node` are available

## Installation Process

1. Clone this repository from GitHub:

   ```bash
   git clone <your-repo-url>
   ```

2. Move to the project directory:

   ```bash
   cd <repo-folder>
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

## Usage

Run the demo app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

Extension controls:

- Toggle on/off: Ctrl + Shift + M
- Trigger click: Spacebar

## Voice keyword cheatsheet (demo page)
The demo page reacts to simple keywords in your phrase:
- Add to cart: say `add`, `add to cart`, `add to bag`, `buy`, or `purchase`
- Delete from cart: say `delete`, `remove`, or `clear` (e.g., "remove 2 stadium mesh pants")

Tip: include the product name in the phrase, e.g. "add to cart stadium mesh pants".


## Extension Installation (Local)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Click "Details" and open "Extension options"

## Build for Production

Build and run the Next.js app:

```bash
npm run build
npm run start
```

Note: The Chrome extension is loaded unpacked for local use. If you need a packaged build, use Chrome’s "Pack extension" in `chrome://extensions`.

## Project Structure

- `src/` Next.js app
- `src/app/api/embeddings-match/route.ts` Gemini embeddings API route
- `src/app/api/checkout/route.ts` Stripe Checkout API route
- `extension/` Chrome extension (content scripts, options UI)
- `public/` static assets for the Next.js app

## API Documentation

Gemini embeddings (demo):

- Endpoint: `src/app/api/embeddings-match/route.ts`
- Env var: `GEMINI_API_KEY=your_key_here`

Stripe checkout:

- Endpoint: `src/app/api/checkout/route.ts`
- Env var: `STRIPE_SECRET_KEY=sk_test_...`

Notes:
- API keys are server-side only.
- Do not expose keys in client-side code.

## Development

Common scripts:

```bash
npm run dev
npm run lint
```

Optional environment setup:

1. Create a `.env.local` file at the project root.
2. Add any needed keys (`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`).
3. Restart the dev server if it’s already running.



## Settings
Open the extension options page to adjust:
- Snap radius
- Release radius
- Hysteresis margin

## Contributing

1. Fork the repo and create a feature branch.
2. Make changes with clear commits.
3. Run `npm run lint` before opening a PR.
4. Open a pull request with a short description and screenshots if UI changes are involved.

## License

Licensed under the MIT license. See `LICENSE.md`.
