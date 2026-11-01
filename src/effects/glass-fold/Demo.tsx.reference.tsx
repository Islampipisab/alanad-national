/**
 * REFERENCE ONLY — GradFlow / GlassFold React demo (Do NOT use in this project).
 * Al-Anad site is Vite + vanilla JS. See ./createGlassFold.js for the port.
 *
 * Source inspiration: https://gradflow.meerbahadin.dev + 21st.dev Glass Fold
 * Package: `gradflow` (MIT) — type "fold" = folded translucent glass panes.
 */
import { GradFlow } from 'gradflow';

export default function GlassFoldDemo() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <GradFlow
          config={{
            type: 'fold',
            color1: '#123D2B',
            color2: '#08291D',
            color3: '#B5D95B',
            speed: 0.45,
            scale: 1.05,
            noise: 0.12,
          }}
        />
      </div>
      {/* content */}
    </div>
  );
}
