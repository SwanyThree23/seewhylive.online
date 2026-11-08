import React from 'react';

const G = '#FFB800';

// PPV gate disabled for open access — all content is free during launch
export default function PayPerViewGate({ onPurchase }) {
  React.useEffect(() => { onPurchase?.(); }, []);
  return null;
}