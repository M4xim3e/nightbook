'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Loader2, ShoppingCart, Clock } from 'lucide-react'
import { CATEGORIES, UNITS, CATEGORY_LABELS, getDefaultShelfLife } from '@/lib/utils'
import { Product } from '@/lib/types/database'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    category: 'autre',
    unit: 'unité',
    default_shelf_life_days: 7,
  })

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!restaurant) return
    setRestaurantId(restaurant.id)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('name')

    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openAdd = () => {
    setEditingProduct(null)
    setForm({ name: '', category: 'autre', unit: 'unité', default_shelf_life_days: 7 })
    setShowDialog(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      default_shelf_life_days: product.default_shelf_life_days,
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' })
      return
    }

    setSaving(true)

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          name: form.name,
          category: form.category as any,
          unit: form.unit as any,
          default_shelf_life_days: form.default_shelf_life_days,
        })
        .eq('id', editingProduct.id)

      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
        setSaving(false)
        return
      }
      toast({ title: 'Produit mis à jour' })
    } else {
      const { error } = await supabase.from('products').insert({
        restaurant_id: restaurantId,
        name: form.name,
        category: form.category as any,
        unit: form.unit as any,
        default_shelf_life_days: form.default_shelf_life_days,
      })

      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
        setSaving(false)
        return
      }
      toast({ title: 'Produit ajouté au catalogue' })
    }

    setSaving(false)
    setShowDialog(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Produit supprimé' })
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const groupedProducts = CATEGORIES.reduce((acc, cat) => {
    const catProducts = products.filter((p) => p.category === cat)
    if (catProducts.length > 0) acc[cat] = catProducts
    return acc
  }, {} as Record<string, Product[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue produits</h1>
          <p className="text-gray-500 mt-1">{products.length} produit(s) dans votre catalogue</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a4731]" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucun produit dans le catalogue</p>
          <p className="text-sm mt-1">Ajoutez vos produits habituels pour les retrouver rapidement</p>
          <Button onClick={openAdd} className="mt-4">Ajouter mon premier produit</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([category, catProducts]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {CATEGORY_LABELS[category]}
                  <Badge variant="secondary">{catProducts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {catProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>{product.unit}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              DLC par défaut: {product.default_shelf_life_days}j
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nom du produit *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Filet de saumon"
              />
            </div>
            <div className="space-y-1">
              <Label>Catégorie</Label>
              <select
                value={form.category}
                onChange={(e) => {
                  const cat = e.target.value
                  setForm({ ...form, category: cat, default_shelf_life_days: getDefaultShelfLife(cat) })
                }}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Unité</Label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  DLC par défaut (jours)
                </Label>
                <Input
                  type="number"
                  value={form.default_shelf_life_days}
                  onChange={(e) => setForm({ ...form, default_shelf_life_days: Number(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
