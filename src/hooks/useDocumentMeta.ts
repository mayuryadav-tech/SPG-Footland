import { useEffect } from 'react';

export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const fullTitle = title.includes('SPG Footland') ? title : `${title} | SPG Footland`;
    document.title = fullTitle;

    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [title, description]);
}
