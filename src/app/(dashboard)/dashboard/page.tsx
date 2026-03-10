import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { differenceInDays, parseISO, subDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Package, AlertTriangle, Truck, ScanLine, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { StockChart } from '@/components/dashboard/stock-chart'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) redirect('/register')

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const in2DaysStr = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch active stock entries
  const { data: stockEntries } = await supabase
    .from('stock_entries')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_consumed', false)
    .order('expiry_date', { ascending: true })

  const entries = stockEntries || []

  // KPI calculations
  const totalInStock = entries.length
  const expiredEntries = entries.filter((e) => e.expiry_date < todayStr)
  const criticalEntries = entries.filter(
    (e) => e.expiry_date >= todayStr && e.expiry_date <= in2DaysStr
  )
  const urgentAlerts = [...expiredEntries, ...criticalEntries]

  // Recent deliveries (last 5)
  const { data: recentDeliveries } = await supabase
    .from('stock_entries')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Stock over 30 days (group by delivery date)
  const thirtyDaysAgo = subDays(today, 30)
  const { data: thirtyDayStock } = await supabase
    .from('stock_entries')
    .select('delivery_date, quantity')
    .eq('restaurant_id', restaurant.id)
    .gte('delivery_date', thirtyDaysAgo.toISOString().split('T')[0])

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i)
    const dateStr = date.toISOString().split('T')[0]
    const totalQty = (thirtyDayStock || [])
      .filter((e) => e.delivery_date === dateStr)
      .reduce((sum, e) => sum + Number(e.quantity), 0)
    return {
      date: format(date, 'd MMM', { locale: fr }),
      livraisons: totalQty,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour 👋</h1>
          <p className="text-gray-500 mt-1">{restaurant.name} — voici votre tableau de bord</p>
        </div>
        <Link href="/scan">
          <Button size="sm" className="gap-2">
            <ScanLine className="h-4 w-4" />
            Scanner une facture
          </Button>
        </Link>
      </div>

      {/* Urgent alerts banner */}
      {urgentAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              {urgentAlerts.length} produit{urgentAlerts.length > 1 ? 's' : ''} nécessite{urgentAlerts.length === 1 ? '' : 'nt'} votre attention
            </p>
            <p className="text-red-600 text-sm mt-1">
              {expiredEntries.length > 0 && `${expiredEntries.length} expiré${expiredEntries.length > 1 ? 's' : ''}`}
              {expiredEntries.length > 0 && criticalEntries.length > 0 && ', '}
              {criticalEntries.length > 0 && `${criticalEntries.length} expire${criticalEntries.length > 1 ? 'nt' : ''} dans moins de 48h`}
            </p>
            <Link href="/stock" className="text-red-700 text-sm font-medium underline mt-1 inline-block">
              Voir le stock →
            </Link>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-[#1a4731]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalInStock}</p>
                <p className="text-sm text-gray-500">Produits en stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={criticalEntries.length > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${criticalEntries.length > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${criticalEntries.length > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${criticalEntries.length > 0 ? 'text-orange-700' : 'text-gray-900'}`}>
                  {criticalEntries.length}
                </p>
                <p className="text-sm text-gray-500">Expirent dans 48h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={expiredEntries.length > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${expiredEntries.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertCircle className={`h-5 w-5 ${expiredEntries.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${expiredEntries.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                  {expiredEntries.length}
                </p>
                <p className="text-sm text-gray-500">Produits expirés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent alerts widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertes urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentAlerts.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentAlerts.slice(0, 5).map((entry) => {
                  const days = differenceInDays(parseISO(entry.expiry_date), today)
                  const isExpired = days < 0
                  const isToday = days === 0
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{entry.product_name}</p>
                        <p className="text-xs text-gray-500">{entry.quantity} {entry.unit} · {entry.supplier || 'Fournisseur inconnu'}</p>
                      </div>
                      <Badge variant={isExpired ? 'destructive' : isToday ? 'destructive' : 'warning'}>
                        {isExpired ? `Expiré (${Math.abs(days)}j)` : isToday ? "Aujourd'hui" : `J-${days}`}
                      </Badge>
                    </div>
                  )
                })}
                {urgentAlerts.length > 5 && (
                  <Link href="/stock" className="text-sm text-[#1a4731] hover:underline block text-center pt-1">
                    +{urgentAlerts.length - 5} autres alertes →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent deliveries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#1a4731]" />
                Dernières livraisons
              </CardTitle>
              <Link href="/stock" className="text-sm text-[#1a4731] hover:underline">
                Voir tout →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!recentDeliveries || recentDeliveries.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune livraison enregistrée</p>
                <Link href="/scan" className="text-sm text-[#1a4731] hover:underline block mt-2">
                  Scanner une facture →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDeliveries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{entry.product_name}</p>
                      <p className="text-xs text-gray-500">
                        {entry.quantity} {entry.unit} · {formatDate(entry.delivery_date)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{entry.supplier || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock evolution chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des livraisons (30 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <StockChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
