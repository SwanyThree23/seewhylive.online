import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ShoppingBag, Sparkles } from 'lucide-react';

const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  epic: 'bg-purple-100 text-purple-800 border-purple-300',
  legendary: 'bg-amber-100 text-amber-800 border-amber-300',
};

export default function VirtualGoodsStore({ userId }) {
  const [selectedType, setSelectedType] = useState('all');
  const queryClient = useQueryClient();

  const { data: goods = [], isLoading } = useQuery({
    queryKey: ['virtualGoods', selectedType],
    queryFn: async () => {
      const allGoods = await base44.entities.VirtualGood.list();
      return selectedType === 'all' 
        ? allGoods.filter(g => g.is_active)
        : allGoods.filter(g => g.is_active && g.type === selectedType);
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['userInventory', userId],
    queryFn: () => base44.entities.UserInventory.filter({ user_id: userId }),
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ good }) => {
      await base44.entities.Transaction.create({
        type: 'virtual_good',
        amount: good.price,
        from_user_id: userId,
        virtual_good_id: good.id,
        status: 'completed',
      });

      await base44.entities.UserInventory.create({
        user_id: userId,
        virtual_good_id: good.id,
        acquired_date: new Date().toISOString(),
      });

      if (good.is_limited && good.stock) {
        await base44.entities.VirtualGood.update(good.id, {
          stock: good.stock - 1,
        });
      }
    },
    onSuccess: () => {
      toast.success('Item purchased! ✨');
      queryClient.invalidateQueries(['virtualGoods']);
      queryClient.invalidateQueries(['userInventory']);
    },
    onError: () => {
      toast.error('Purchase failed');
    },
  });

  const isOwned = (goodId) => {
    return inventory.some(item => item.virtual_good_id === goodId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Virtual Goods Store</h2>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="badge">Badges</TabsTrigger>
          <TabsTrigger value="emoji">Emojis</TabsTrigger>
          <TabsTrigger value="theme">Themes</TabsTrigger>
          <TabsTrigger value="effect">Effects</TabsTrigger>
          <TabsTrigger value="frame">Frames</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading items...</div>
          ) : goods.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No items available</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goods.map((good) => (
                <Card key={good.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {good.name}
                          {good.is_limited && (
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{good.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={rarityColors[good.rarity]} variant="outline">
                        {good.rarity}
                      </Badge>
                      {good.is_limited && good.stock !== undefined && (
                        <Badge variant="outline">
                          {good.stock} left
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {good.image_url && (
                    <CardContent>
                      <img 
                        src={good.image_url} 
                        alt={good.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </CardContent>
                  )}

                  <CardFooter className="flex items-center justify-between">
                    <span className="text-lg font-bold">${good.price}</span>
                    {isOwned(good.id) ? (
                      <Badge>Owned</Badge>
                    ) : (
                      <Button
                        onClick={() => purchaseMutation.mutate({ good })}
                        disabled={purchaseMutation.isPending || (good.is_limited && good.stock === 0)}
                        size="sm"
                      >
                        {purchaseMutation.isPending ? 'Buying...' : 'Buy Now'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}