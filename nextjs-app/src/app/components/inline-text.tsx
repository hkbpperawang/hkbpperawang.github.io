import React from 'react';

// Parser inline aman untuk teks lirik: dukung <u>, <i>, <b>; lainnya diabaikan.
// Tidak menggunakan dangerouslySetInnerHTML.
export function InlineText({ text }: { text: string }) {
  // Pecah berdasarkan tag yang diizinkan, case-insensitive
  const tokens = text.split(/(<\/?u>|<\/?i>|<\/?b>)/gi);

  let underline = false;
  let italic = false;
  let bold = false;

  const nodes: React.ReactNode[] = [];

  const cls = () => {
    const classes: string[] = [];
    if (underline) classes.push('underline underline-offset-2 decoration-2');
    if (italic) classes.push('italic');
    if (bold) classes.push('font-semibold');
    return classes.join(' ');
  };

  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (lower === '<u>') { underline = true; continue; }
    if (lower === '</u>') { underline = false; continue; }
    if (lower === '<i>') { italic = true; continue; }
    if (lower === '</i>') { italic = false; continue; }
    if (lower === '<b>') { bold = true; continue; }
    if (lower === '</b>') { bold = false; continue; }

    // Bukan tag: render sebagai teks; bungkus span saat ada gaya aktif
    if (underline || italic || bold) {
      nodes.push(<span key={nodes.length} className={cls()}>{tok}</span>);
    } else {
      nodes.push(<React.Fragment key={nodes.length}>{tok}</React.Fragment>);
    }
  }

  return <>{nodes}</>;
}
