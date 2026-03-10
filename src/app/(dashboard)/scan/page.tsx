'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { toast } from '@/hooks/use-toast'
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  Trash2,
  Plus,
  Clock,
} from 'lucide-react'
import { addDaysToDate, getDefaultShelfLife, CATEGORIES, UNITS, CATEGORY_LABELS } from '@/lib/utils'
import { format } from 'date-fns'

interface ExtractedProduct {
  name: string
  quantity: number
  unit: string
  category: string
  unit_price: number | null
  expiry_date: string
}

interface InvoiceData {
  supplier: string | null
  invoice_number: string | null
  delivery_date: string | null
  products: ExtractedProduct[]
}

export default function ScanPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null)
  const [editableProducts, setEditableProducts] = useState<ExtractedProduct[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('owner_id', user.id).single()
    if (!restaurant) return
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setInvoiceHistory(data || [])
    setHistoryLoaded(true)
  }, [historyLoaded, supabase])

  useState(() => {
    loadHistory()
  })

  const handleFileSelect = (file: File) => {
    setImageFile(file)
    setExtractedData(null)
    setEditableProducts([])
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    setAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('/api/scan/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur lors de l\'analyse')
      }

      const data = await response.json()
      const today = new Date().toISOString().split('T')[0]

      const productsWithExpiry = (data.products || []).map((p: any) => ({
        name: p.name || '',
        quantity: Number(p.quantity) || 1,
        unit: p.unit || 'unité',
        category: p.category || 'autre',
        unit_price: p.unit_price ? Number(p.unit_price) : null,
        expiry_date: addDaysToDate(
          new Date(data.delivery_date || today),
          getDefaultShelfLife(p.category || 'autre')
        ),
      }))

      setExtractedData({ ...data, products: productsWithExpiry })
      setEditableProducts(productsWithExpiry)

      toast({
        title: 'Analyse réussie',
        description: `${productsWithExpiry.length} produit(s) détecté(s)`,
        variant: 'success' as any,
      })
    } catch (err: any) {
      toast({
        title: 'Erreur d\'analyse',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const updateProduct = (index: number, field: keyof ExtractedProduct, value: any) => {
    setEditableProducts((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      // Auto-update expiry when category changes
      if (field === 'category') {
        const deliveryDate = new Date(extractedData?.delivery_date || new Date())
        updated[index].expiry_date = addDaysToDate(deliveryDate, getDefaultShelfLife(value))
      }
      return updated
    })
  }

  const removeProduct = (index: number) => {
    setEditableProducts((prev) => prev.filter((_, i) => i !== index))
  }

  const addProduct = () => {
    setEditableProducts((prev) => [
      ...prev,
      {
        name: '',
        quantity: 1,
        unit: 'unité',
        category: 'autre',
        unit_price: null,
        expiry_date: addDaysToDate(new Date(), 7),
      },
    ])
  }

  const handleConfirm = async () => {
    if (editableProducts.length === 0) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!restaurant) throw new Error('Restaurant introuvable')

      // Upload image
      let imageUrl = ''
      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, imageFile)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(uploadData.path)
          imageUrl = publicUrl
        }
      }

      // Save invoice record
      const { data: invoice } = await supabase
        .from('invoices')
        .insert({
          restaurant_id: restaurant.id,
          image_url: imageUrl || 'manual',
          raw_extracted_data: extractedData as any,
          status: 'processed',
        })
        .select()
        .single()

      // Save stock entries
      const stockEntries = editableProducts
        .filter((p) => p.name.trim())
        .map((p) => ({
          restaurant_id: restaurant.id,
          product_name: p.name,
          quantity: p.quantity,
          unit: p.unit,
          category: (CATEGORIES.includes(p.category as any) ? p.category : 'autre') as any,
          delivery_date: extractedData?.delivery_date || new Date().toISOString().split('T')[0],
          expiry_date: p.expiry_date,
          supplier: extractedData?.supplier || null,
          invoice_number: extractedData?.invoice_number || null,
          invoice_image_url: imageUrl || null,
          is_consumed: false,
        }))

      const { error: stockError } = await supabase.from('stock_entries').insert(stockEntries)

      if (stockError) throw new Error(stockError.message)

      toast({
        title: 'Stock mis à jour',
        description: `${stockEntries.length} produit(s) ajouté(s) au stock`,
        variant: 'success' as any,
      })

      // Reset
      setImageFile(null)
      setImagePreview(null)
      setExtractedData(null)
      setEditableProducts([])
      setHistoryLoaded(false)
      loadHistory()
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scanner une facture</h1>
        <p className="text-gray-500 mt-1">Prenez en photo ou importez votre bon de livraison</p>
      </div>

      {/* Upload area */}
      <Card>
        <CardContent className="p-6">
          {!imagePreview ? (
            <div className="space-y-4">
              {/* Camera capture (mobile) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[#1a4731]/30 rounded-xl hover:border-[#1a4731] hover:bg-green-50 transition-all group"
              >
                <div className="w-14 h-14 bg-[#1a4731]/10 group-hover:bg-[#1a4731]/20 rounded-full flex items-center justify-center transition-colors">
                  <Camera className="h-7 w-7 text-[#1a4731]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Prendre une photo</p>
                  <p className="text-sm text-gray-500">Ouvre la caméra sur mobile</p>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* File upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Importer un fichier</p>
                  <p className="text-xs text-gray-500">JPG, PNG, PDF jusqu'à 10 Mo</p>
                </div>
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Facture"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    setExtractedData(null)
                    setEditableProducts([])
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow border border-gray-200 hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                {imageFile?.name} · {((imageFile?.size || 0) / 1024).toFixed(0)} Ko
              </p>

              {!extractedData && (
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5" />
                      Analyser avec l'IA
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted data */}
      {extractedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Produits détectés
              </CardTitle>
              <div className="text-sm text-gray-500 space-y-0.5 text-right">
                {extractedData.supplier && <p>Fournisseur: <span className="font-medium text-gray-900">{extractedData.supplier}</span></p>}
                {extractedData.invoice_number && <p>N°: <span className="font-medium text-gray-900">{extractedData.invoice_number}</span></p>}
                {extractedData.delivery_date && <p>Livraison: <span className="font-medium text-gray-900">{extractedData.delivery_date}</span></p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editableProducts.map((product, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Input
                    value={product.name}
                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                    placeholder="Nom du produit"
                    className="font-medium"
                  />
                  <button
                    onClick={() => removeProduct(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Quantité</label>
                    <Input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', Number(e.target.value))}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                    <select
                      value={product.unit}
                      onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
                    <select
                      value={product.category}
                      onChange={(e) => updateProduct(index, 'category', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Date d'expiration
                    </label>
                    <Input
                      type="date"
                      value={product.expiry_date}
                      onChange={(e) => updateProduct(index, 'expiry_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addProduct}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#1a4731] hover:text-[#1a4731] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </button>

            <Button
              onClick={handleConfirm}
              disabled={saving || editableProducts.filter((p) => p.name.trim()).length === 0}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmer et ajouter au stock ({editableProducts.filter((p) => p.name.trim()).length})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invoice history */}
      {invoiceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoiceHistory.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {invoice.raw_extracted_data?.supplier || 'Fournisseur inconnu'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString('fr-FR')} ·{' '}
                    {invoice.raw_extracted_data?.products?.length || 0} produit(s)
                  </p>
                </div>
                <Badge
                  variant={
                    invoice.status === 'processed' ? 'success' :
                    invoice.status === 'error' ? 'destructive' : 'secondary'
                  }
                >
                  {invoice.status === 'processed' ? 'Traité' : invoice.status === 'error' ? 'Erreur' : 'En cours'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
