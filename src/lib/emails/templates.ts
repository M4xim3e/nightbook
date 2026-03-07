export function confirmationEmail({
  clientName,
  eventName,
  eventDate,
  eventTime,
  tableName,
  venueName,
  venueAddress,
  venueCity,
  dressCode,
  arrivalInfo,
  guestCount,
  depositAmount,
  specialRequest,
}: {
  clientName: string
  eventName: string
  eventDate: string
  eventTime: string
  tableName: string
  venueName: string
  venueAddress?: string
  venueCity?: string
  dressCode?: string
  arrivalInfo?: string
  guestCount: number
  depositAmount: number
  specialRequest?: string
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réservation</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">NightBook</h1>
      <p style="color:#71717a;margin:0;font-size:14px;">Plateforme de réservation VIP</p>
    </div>

    <!-- Card principale -->
    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;margin-bottom:16px;">
      
      <!-- Icône succès -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#16a34a20;border-radius:50%;padding:16px;">
          <span style="font-size:32px;">✅</span>
        </div>
      </div>

      <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 8px;text-align:center;">
        Réservation confirmée !
      </h2>
      <p style="color:#a1a1aa;font-size:14px;text-align:center;margin:0 0 28px;">
        Bonjour ${clientName}, votre place est bien réservée.
      </p>

      <!-- Détails -->
      <div style="border-top:1px solid #27272a;padding-top:20px;space-y:12px;">
        ${[
          ['📅 Soirée', eventName],
          ['📆 Date', `${eventDate} à ${eventTime}`],
          ['🛋️ Carré', tableName],
          ['📍 Lieu', venueAddress ? `${venueAddress}${venueCity ? ', ' + venueCity : ''}` : venueName],
          ['👥 Personnes', `${guestCount} personne${guestCount > 1 ? 's' : ''}`],
        ].map(([label, value]) => `
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #27272a20;">
            <span style="color:#71717a;font-size:13px;">${label}</span>
            <span style="color:#ffffff;font-size:13px;font-weight:500;">${value}</span>
          </div>
        `).join('')}
        
        <!-- Acompte -->
        <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:4px;">
          <span style="color:#a1a1aa;font-size:14px;font-weight:600;">💳 Acompte payé</span>
          <span style="color:#a855f7;font-size:16px;font-weight:700;">${(depositAmount / 100).toFixed(0)}€</span>
        </div>
      </div>
    </div>

    ${specialRequest ? `
    <!-- Demande spéciale -->
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#a855f7;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">✨ Votre demande spéciale</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${specialRequest}</p>
    </div>
    ` : ''}

    ${arrivalInfo ? `
    <!-- Infos arrivée -->
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">📍 Infos arrivée</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${arrivalInfo}</p>
    </div>
    ` : ''}

    ${dressCode ? `
    <!-- Dress code -->
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">👔 Dress code</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${dressCode}</p>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#3f3f46;font-size:12px;margin:0;">
        Cet email a été envoyé automatiquement par NightBook.<br>
        En cas de problème, contactez directement l'établissement.
      </p>
    </div>

  </div>
</body>
</html>
  `
}

export function reminderEmail({
  clientName,
  eventName,
  eventDate,
  eventTime,
  tableName,
  venueName,
  venueAddress,
  venueCity,
  dressCode,
  arrivalInfo,
  guestCount,
}: {
  clientName: string
  eventName: string
  eventDate: string
  eventTime: string
  tableName: string
  venueName: string
  venueAddress?: string
  venueCity?: string
  dressCode?: string
  arrivalInfo?: string
  guestCount: number
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rappel de réservation</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">NightBook</h1>
    </div>

    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;margin-bottom:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;">🎉</span>
      </div>
      <h2 style="color:#ffffff;font-size:20px;font-weight:600;margin:0 0 8px;text-align:center;">
        C'est ce soir !
      </h2>
      <p style="color:#a1a1aa;font-size:14px;text-align:center;margin:0 0 28px;">
        Bonjour ${clientName}, votre soirée VIP est ce soir. On vous attend !
      </p>

      <div style="border-top:1px solid #27272a;padding-top:20px;">
        ${[
          ['📅 Soirée', eventName],
          ['🕐 Heure', eventTime],
          ['🛋️ Carré', tableName],
          ['📍 Lieu', venueAddress ? `${venueAddress}${venueCity ? ', ' + venueCity : ''}` : venueName],
          ['👥 Personnes', `${guestCount} personne${guestCount > 1 ? 's' : ''}`],
        ].map(([label, value]) => `
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #27272a20;">
            <span style="color:#71717a;font-size:13px;">${label}</span>
            <span style="color:#ffffff;font-size:13px;font-weight:500;">${value}</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${arrivalInfo ? `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">📍 Infos arrivée</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${arrivalInfo}</p>
    </div>
    ` : ''}

    ${dressCode ? `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">👔 Dress code</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${dressCode}</p>
    </div>
    ` : ''}

    <div style="text-align:center;margin-top:24px;">
      <p style="color:#3f3f46;font-size:12px;margin:0;">NightBook — Plateforme de réservation VIP</p>
    </div>

  </div>
</body>
</html>
  `
}
