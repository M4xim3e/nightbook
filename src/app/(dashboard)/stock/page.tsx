'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Package,
  Loader2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import {
  getExpiryStatus,
  getExpiryLabel,
  CATEGORIES,
  UNITS,
  CATEGORY_LABELS,
  addDaysToDate,
  getDefaultShelfLife,
} from '@/lib/utils'
import { StockEntry } from '@/lib/types/database'

const STATUS_LABELS = {
  expired: { label: 'Expiré', variant: 'destructive' as const, color: 'bg-red-50 text-red-700' },
  critical: { label: "Expire aujourd'hui/demain", variant: 'destructive' as const, color: 'bg-red-50 text-red-700' },
  warning: { label: 'Expire bientôt', variant: 'warning' as const, color: 'bg-orange-50 text-orange-700' },
  ok: { label: 'OK', variant: 'success' as const, color: 'bg-green-50 text-green-700' },
}

export default function StockPage() {
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  const { toast } = useToast()

  const [newEntry, setNewEntry] = useState({
    product_name: '',
    quantity: '',
    unit: 'unité',
    category: 'autre',
    delivery_date: new Date().toISOString().split('T')[0],
    expiry_date: addDaysToDate(new Date(), 7),
    supplier: '',
    notes: '',
  })

  const supabase = createClient()

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
      .from('stock_entries')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_consumed', false)
      .order('expiry_date', { ascending: true })

    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleMarkConsumed = async (id: string) => {
    const { error } = await supabase
      .from('stock_entries')
      .update({ is_consumed: true })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
      return
    }

    setEntries((prev) => prev.filter((e) => e.id !== id))
    toast({ title: 'Marqué comme consommé', variant: 'default' })
  }

  const handleAddEntry = async () => {
    if (!newEntry.product_name.trim() || !newEntry.quantity) {
      toast({ title: 'Champs requis manquants', variant: 'destructive' })
      return
    }

    setSaving(true)
    const { error } = await supabase.from('stock_entries').insert({
      restaurant_id: restaurantId,
      product_name: newEntry.product_name,
      quantity: Number(newEntry.quantity),
      unit: newEntry.unit,
      category: newEntry.category as any,
      delivery_date: newEntry.delivery_date,
      expiry_date: newEntry.expiry_date,
      supplier: newEntry.supplier || null,
      notes: newEntry.notes || null,
      is_consumed: false,
    })

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    toast({ title: 'Produit ajouté au stock' })
    setShowAddDialog(false)
    setNewEntry({
      product_name: '',
      quantity: '',
      unit: 'unité',
      category: 'autre',
      delivery_date: new Date().toISOString().split('T')[0],
      expiry_date: addDaysToDate(new Date(), 7),
      supplier: '',
      notes: '',
    })
    setSaving(false)
    loadData()
  }

  // Filter and search
  const suppliers = [...new Set(entries.map((e) => e.supplier).filter(Boolean))]

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.supplier?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory
    const matchesSupplier = filterSupplier === 'all' || entry.supplier === filterSupplier
    const status = getExpiryStatus(entry.expiry_date)
    const matchesStatus = filterStatus === 'all' || status === filterStatus

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-gray-500 mt-1">{entries.length} produit(s) en stock</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter manuellement
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
        >
          <option value="all">Tous statuts</option>
          <option value="expired">Expiré</option>
          <option value="critical">Critique</option>
          <option value="warning">Attention</option>
          <option value="ok">OK</option>
        </select>

        {suppliers.length > 0 && (
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
          >
            <option value="all">Tous fournisseurs</option>
            {suppliers.map((s) => (
              <option key={s} value={s!}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a4731]" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucun produit en stock</p>
          <p className="text-sm mt-1">Scannez une facture pour ajouter des produits</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl border border-gray-200 text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Produit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Quantité</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Livraison</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expiration</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Fournisseur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const status = getExpiryStatus(entry.expiry_date)
                const statusConfig = STATUS_LABELS[status]
                const rowClass =
                  status === 'expired' ? 'bg-red-50/50' :
                  status === 'critical' ? 'bg-red-50/30' :
                  status === 'warning' ? 'bg-orange-50/30' : ''

                return (
                  <tr key={entry.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${rowClass}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{entry.product_name}</p>
                      {entry.invoice_number && (
                        <p className="text-xs text-gray-400">N° {entry.invoice_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[entry.category] || entry.category}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{entry.quantity}</span>
                      <span className="text-gray-500 ml-1">{entry.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {new Date(entry.delivery_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {new Date(entry.expiry_date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className={`text-xs ${status === 'ok' ? 'text-green-600' : status === 'warning' ? 'text-orange-600' : 'text-red-600'}`}>
                        {getExpiryLabel(entry.expiry_date)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {entry.supplier || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig.variant}>
                        {status === 'expired' ? 'Expiré' :
                         status === 'critical' ? 'Critique' :
                         status === 'warning' ? 'Attention' : 'OK'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkConsumed(entry.id)}
                        className="text-gray-500 hover:text-[#1a4731] gap-1 text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Consommé
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add entry dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un produit manuellement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nom du produit *</Label>
              <Input
                value={newEntry.product_name}
                onChange={(e) => setNewEntry({ ...newEntry, product_name: e.target.value })}
                placeholder="Ex: Filet de bœuf"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantité *</Label>
                <Input
                  type="number"
                  value={newEntry.quantity}
                  onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label>Unité</Label>
                <select
                  value={newEntry.unit}
                  onChange={(e) => setNewEntry({ ...newEntry, unit: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Catégorie</Label>
              <select
                value={newEntry.category}
                onChange={(e) => {
                  const cat = e.target.value
                  setNewEntry({
                    ...newEntry,
                    category: cat,
                    expiry_date: addDaysToDate(new Date(newEntry.delivery_date), getDefaultShelfLife(cat)),
                  })
                }}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date de livraison</Label>
                <Input
                  type="date"
                  value={newEntry.delivery_date}
                  onChange={(e) => setNewEntry({ ...newEntry, delivery_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Date d'expiration *</Label>
                <Input
                  type="date"
                  value={newEntry.expiry_date}
                  onChange={(e) => setNewEntry({ ...newEntry, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fournisseur</Label>
              <Input
                value={newEntry.supplier}
                onChange={(e) => setNewEntry({ ...newEntry, supplier: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAddEntry} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
