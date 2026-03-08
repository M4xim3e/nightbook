'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Venue = {
  id: string
  name: string
  slug: string
  city: string
  status: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:    { label: 'Actif',     bg: 'rgba(22,163,74,0.1)',   text: '#22c55e', dot: '#22c55e' },
  paused:    { label: 'En pause',  bg: 'rgba(234,179,8,0.1)',   text: '#eab308', dot: '#eab308' },
  suspended: { label: 'Suspendu',  bg: 'rgba(220,38,38,0.1)',   text: '#ef4444', dot: '#ef4444' },
}

export default function AdminPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: adminRecord } = await supabase
      .from('admins').select('id').eq('email', user.email).single()
    if (!adminRecord) { router.push('/dashboard'); return }

    const { data } = await supabase
      .from('venues').select('id,name,slug,city,status,created_at')
      .order('created_at', { ascending: false })

    setVenues(data || [])
    setLoading(false)
  }

  const setStatus = async (venue: Venue, newStatus: string) => {
    const labels: Record<string, string> = { active: 'activer', paused: 'mettre en pause', suspended: 'suspendre' }
    if (!confirm(`Voulez-vous ${labels[newStatus]} "${venue.name}" ?`)) return
    await supabase.from('venues').update({ status: newStatus, is_active: newStatus === 'active' }).eq('id', venue.id)
    await loadData()
  }

  const stats = {
    total: venues.length,
    active: venues.filter(v => v.status === 'active').length,
    paused: venues.filter(v => v.status === 'paused').length,
    suspended: venues.filter(v => v.status === 'suspended').length,
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'#71717a'}}>Chargement...</p>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',padding:'40px 16px'}}>
      <div style={{maxWidth:'860px',margin:'0 auto'}}>

        <div style={{marginBottom:'32px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
            <div style={{width:'32px',height:'32px',background:'#7c3aed',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>👑</div>
            <h1 style={{color:'#fff',fontSize:'22px',fontWeight:'700',margin:0}}>NightBook Admin</h1>
          </div>
          <p style={{color:'#71717a',fontSize:'13px',margin:0}}>Gestion des etablissements</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'28px'}}>
          {[
            { label: 'Total', value: stats.total, color: '#fff' },
            { label: 'Actifs', value: stats.active, color: '#22c55e' },
            { label: 'En pause', value: stats.paused, color: '#eab308' },
            { label: 'Suspendus', value: stats.suspended, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{background:'#18181b',border:'1px solid #27272a',borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'#71717a',fontSize:'12px',margin:'0 0 4px'}}>{label}</p>
              <p style={{color,fontSize:'24px',fontWeight:'700',margin:0}}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {venues.length === 0 ? (
            <div style={{background:'#18181b',border:'1px solid #27272a',borderRadius:'12px',padding:'48px',textAlign:'center'}}>
              <p style={{color:'#71717a'}}>Aucun etablissement inscrit</p>
            </div>
          ) : venues.map(venue => {
            const cfg = STATUS_CONFIG[venue.status] || STATUS_CONFIG.active
            return (
              <div key={venue.id} style={{background:'#18181b',border:'1px solid #27272a',borderRadius:'12px',padding:'16px 20px',display:'flex',alignItems:'center',gap:'16px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                    <p style={{color:'#fff',fontWeight:'600',margin:0,fontSize:'14px'}}>{venue.name}</p>
                    <span style={{background:cfg.bg,color:cfg.text,fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'20px'}}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{color:'#71717a',fontSize:'12px',margin:0}}>
                    /{venue.slug}{venue.city ? ` · ${venue.city}` : ''} · {formatDate(venue.created_at)}
                  </p>
                </div>
                <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                  {venue.status !== 'active' && (
                    <button onClick={() => setStatus(venue, 'active')}
                      style={{background:'rgba(22,163,74,0.1)',color:'#22c55e',border:'1px solid rgba(22,163,74,0.3)',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
                      Activer
                    </button>
                  )}
                  {venue.status !== 'paused' && (
                    <button onClick={() => setStatus(venue, 'paused')}
                      style={{background:'rgba(234,179,8,0.1)',color:'#eab308',border:'1px solid rgba(234,179,8,0.3)',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
                      Pause
                    </button>
                  )}
                  {venue.status !== 'suspended' && (
                    <button onClick={() => setStatus(venue, 'suspended')}
                      style={{background:'rgba(220,38,38,0.1)',color:'#ef4444',border:'1px solid rgba(220,38,38,0.3)',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
                      Suspendre
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
