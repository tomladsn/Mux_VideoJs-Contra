import { useEffect, useRef, useState } from 'react';

import { skin } from './config';
import { PARAMS_MESSAGE } from './messages';
import { Navbar } from './navbar';
import { readParams, writeParams, type WorkbenchParams } from './params';
import { createUrlWriter } from './url';

const writeUrl = createUrlWriter();

/**
 * A slimmed-down Video.js sandbox for one skin. The preview frame renders the
 * skin on its own page so the shell's styles never reach it.
 */
export function App() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [params] = useState(() => readParams(location.search));
  // The frame loads once with the first settings; later changes are posted to it, so playback is never interrupted.
  const [frameUrl] = useState(() => `./preview.html#${writeParams(params)}`);
  const query = writeParams(params);

  // Every setting lives in the URL, so a reload or a shared link reproduces the preview.
  useEffect(() => {
    // The frame updates straight away; the address bar catches up once changes pause.
    writeUrl(`?${query}`);
    frame.current?.contentWindow?.postMessage({ type: PARAMS_MESSAGE, query }, location.origin);
  }, [query]);

  // Match the workbench chrome to a scheme explicitly supplied in the preview URL.
  useEffect(() => {
    if (params.scheme === 'auto') delete document.documentElement.dataset.colorScheme;
    else document.documentElement.dataset.colorScheme = params.scheme;
  }, [params.scheme]);

  return (
    <div className="bg-background text-foreground h-screen min-h-0 overflow-hidden">
      <Navbar previewUrl={`./preview.html#${query}`} />
      <main className="flex h-[calc(100svh-3.5rem)] min-h-0 min-w-0 flex-col">
        <iframe
          ref={frame}
          src={frameUrl}
          onLoad={() => frame.current?.contentWindow?.postMessage({ type: PARAMS_MESSAGE, query }, location.origin)}
          className="min-h-0 w-full flex-1 border-0"
          title={`${skin.name} preview`}
        />
      </main>
    </div>
  );
}
