import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 })
    }

    // Convert file to base64
    const buffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    const prompt = `Tu es un assistant spécialisé dans la lecture de factures et bons de livraison pour restaurants. Analyse cette image et extrait toutes les informations. Réponds UNIQUEMENT en JSON valide : { "supplier": "...", "invoice_number": "...", "delivery_date": "YYYY-MM-DD", "products": [{ "name": "...", "quantity": 0, "unit": "...", "category": "viande|poisson|légumes|produits laitiers|épicerie|boissons|autre", "unit_price": 0 }] }. Si tu ne peux pas lire une info, mets null. Ne réponds rien d'autre que le JSON.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    let parsedData
    try {
      // Clean potential markdown code blocks
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedData = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Impossible d'analyser la réponse de l'IA. Essayez avec une image plus nette." },
        { status: 422 }
      )
    }

    // Validate basic structure
    if (!parsedData.products || !Array.isArray(parsedData.products)) {
      return NextResponse.json(
        { error: 'Format de données invalide. Assurez-vous que l\'image contient une facture lisible.' },
        { status: 422 }
      )
    }

    // Set default delivery date to today if null
    if (!parsedData.delivery_date) {
      parsedData.delivery_date = new Date().toISOString().split('T')[0]
    }

    return NextResponse.json(parsedData)
  } catch (error: any) {
    console.error('Scan analyze error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}
