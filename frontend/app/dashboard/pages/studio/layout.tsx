import { ReactNode } from 'react';
import { studioFontVariables } from '@/lib/studio-fonts';

export default function StudioEditorLayout({ children }: { children: ReactNode }) {
  return <div className={studioFontVariables}>{children}</div>;
}
