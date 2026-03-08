export default function SuspendedPage() {
  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div style={{textAlign:'center',maxWidth:'400px'}}>
        <div style={{width:'56px',height:'56px',background:'rgba(220,38,38,0.15)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}>
          <span style={{fontSize:'24px'}}>🔒</span>
        </div>
        <h1 style={{fontSize:'22px',fontWeight:'700',color:'#fff',marginBottom:'12px'}}>
          Acces suspendu
        </h1>
        <p style={{color:'#a1a1aa',fontSize:'14px',lineHeight:'1.6'}}>
          Votre acces a NightBook a ete suspendu. Contactez-nous pour regulariser votre situation.
        </p>
        <p style={{marginTop:'20px',color:'#7c3aed',fontSize:'14px',fontWeight:'600'}}>
          contact@nightbook.fr
        </p>
      </div>
    </div>
  )
}
