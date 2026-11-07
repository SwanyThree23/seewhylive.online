import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const G = '#FFB800';

// PPV gate disabled for open access — all content is free during launch
export default function PayPerViewGate({ onPurchase }) {
  React.useEffect(() => { onPurchase?.(); }, []);
  return null;
}