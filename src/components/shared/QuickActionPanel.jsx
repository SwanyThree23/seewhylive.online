import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Video, Users, Calendar, DollarSign, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QuickActionPanel({ isOpen, onClose }) {
  const quickActions = [
    { icon: Plus, label: 'Create Room', href: createPageUrl('CreateRoom'), color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { icon: Video, label: 'Go Live', href: createPageUrl('CreateRoom'), color: 'bg-gradient-to-br from-red-500 to-pink-600' },
    { icon: Users, label: 'New Community', href: createPageUrl('CreateCommunity'), color: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { icon: Calendar, label: 'Schedule', href: createPageUrl('ContentCalendar'), color: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { icon: DollarSign, label: 'Earnings', href: createPageUrl('Analytics'), color: 'bg-gradient-to-br from-yellow-500 to-amber-600' },
    { icon: Bell, label: 'Notifications', href: createPageUrl('Notifications'), color: 'bg-gradient-to-br from-purple-500 to-pink-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0, opacity: 0, x: '50%', y: '50%' }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <Card className="p-6 bg-white/95 backdrop-blur shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-center">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={action.label} to={action.href} onClick={onClose}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        className={`${action.color} text-white h-24 w-full flex flex-col gap-2 hover:opacity-90`}
                      >
                        <action.icon className="w-8 h-8" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </Button>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}