'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Bell, Mail, Smartphone, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { Alert } from '@/lib/types/database'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  const [settings, setSettings] = useState({
    alert_email_enabled: true,
    alert_sms_enabled: false,
    alert_days_before: 2,
    alert_hour: 8,
    phone: '',
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!restaurant) return
      setRestaurantId(restaurant.id)
      setSettings({
        alert_email_enabled: restaurant.alert_email_enabled ?? true,
        alert_sms_enabled: restaurant.alert_sms_enabled ?? false,
        alert_days_before: restaurant.alert_days_before ?? 2,
        alert_hour: restaurant.alert_hour ?? 8,
        phone: restaurant.phone || '',
      })

      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sent_at', { ascending: false })
        .limit(50)

      setAlerts(alertsData || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({
        alert_email_enabled: settings.alert_email_enabled,
        alert_sms_enabled: settings.alert_sms_enabled,
        alert_days_before: settings.alert_days_before,
        alert_hour: settings.alert_hour,
        phone: settings.phone || null,
      })
      .eq('id', restaurantId)

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Paramètres sauvegardés', variant: 'default' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
        <p className="text-gray-500 mt-1">Configurez vos alertes de péremption</p>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#1a4731]" />
            Paramètres des alertes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-[#1a4731]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Alertes email</p>
                <p className="text-sm text-gray-500">Recevez un email avant péremption</p>
              </div>
            </div>
            <Switch
              checked={settings.alert_email_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, alert_email_enabled: checked })}
            />
          </div>

          {/* SMS alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Alertes SMS</p>
                <p className="text-sm text-gray-500">Recevez un SMS (plan Pro requis)</p>
              </div>
            </div>
            <Switch
              checked={settings.alert_sms_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, alert_sms_enabled: checked })}
            />
          </div>

          {settings.alert_sms_enabled && (
            <div className="space-y-2 ml-16">
              <Label>Numéro de téléphone pour SMS</Label>
              <Input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          )}

          {/* Timing settings */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Alerter J avant expiration
              </Label>
              <Input
                type="number"
                value={settings.alert_days_before}
                onChange={(e) => setSettings({ ...settings, alert_days_before: Number(e.target.value) })}
                min={1}
                max={14}
              />
              <p className="text-xs text-gray-500">Ex: 2 = alerte 2 jours avant expiration</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Heure d'envoi
              </Label>
              <Input
                type="number"
                value={settings.alert_hour}
                onChange={(e) => setSettings({ ...settings, alert_hour: Number(e.target.value) })}
                min={0}
                max={23}
              />
              <p className="text-xs text-gray-500">Ex: 8 = envoi à 8h00</p>
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Sauvegarder les paramètres</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Alert history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des alertes envoyées</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1a4731]" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune alerte envoyée</p>
              <p className="text-sm mt-1">Les alertes apparaîtront ici une fois envoyées</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${alert.channel === 'email' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {alert.channel === 'email' ? (
                        <Mail className="h-3.5 w-3.5 text-green-700" />
                      ) : (
                        <Smartphone className="h-3.5 w-3.5 text-orange-700" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {alert.alert_type === 'expired' ? 'Produit expiré' : `Expiration dans ${alert.days_before_expiry}j`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.sent_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.alert_type === 'expired' ? 'destructive' : 'warning'}>
                    {alert.alert_type === 'expired' ? 'Expiré' : 'Péremption proche'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
