import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

const OWNERS = {
  '39634531': { id: '9fa43b79-4ac9-4185-bfa9-cafb02a118db', name: 'MARIA ROSALBA NAVARRETE AREVALO' },
  '19278127': { id: '55d2501f-3790-4886-9ff5-175eaabaa329', name: 'REYES APONTE BUITRAGO' },
}

function parseOwners(rawOwnerName, rawDoc, rawPct) {
  const names = rawOwnerName.split(' / ')
  const docs = rawDoc.split(' / ')
  const pcts = rawPct.split(' / ').map((p) => parseFloat(p.replace('%', '')))
  return names.map((_, i) => {
    const doc = docs[i].trim()
    const owner = OWNERS[doc]
    if (!owner) throw new Error(`Dueño no encontrado: doc ${doc} (${names[i]})`)
    return { owner_id: owner.id, ownership_pct: pcts[i] || 100 }
  })
}

const propertiesData = [
  { file:'BalconesDeSajonia/201.pdf', name:'Balcones De Sajonia Apto 201', address:'KR 17 63 49 AP 201', type:'apartment', chip:'AAA0239FCUH', matricula:'050C01800640', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/203.pdf', name:'Balcones De Sajonia Apto 203', address:'KR 17 63 49 AP 203', type:'apartment', chip:'AAA0239FCAW', matricula:'050C01800642', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/301.pdf', name:'Balcones De Sajonia Apto 301', address:'KR 17 63 49 AP 301', type:'apartment', chip:'AAA0239FCCN', matricula:'050C01800644', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/302.pdf', name:'Balcones De Sajonia Apto 302', address:'KR 17 63 49 AP 302', type:'apartment', chip:'AAA0239FBYX', matricula:'050C01800645', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/401.pdf', name:'Balcones De Sajonia Apto 401', address:'KR 17 63 49 AP 401', type:'apartment', chip:'AAA0239FCDE', matricula:'050C01800646', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/402.pdf', name:'Balcones De Sajonia Apto 402', address:'KR 17 63 49 AP 402', type:'apartment', chip:'AAA0239FCEP', matricula:'050C01800647', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/501.pdf', name:'Balcones De Sajonia Apto 501', address:'KR 17 63 49 AP 501', type:'apartment', chip:'AAA0239FCYN', matricula:'050C01800648', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/502.pdf', name:'Balcones De Sajonia Apto 502', address:'KR 17 63 49 AP 502', type:'apartment', chip:'AAA0239FCHK', matricula:'050C01800649', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/601.pdf', name:'Balcones De Sajonia Apto 601', address:'KR 17 63 49 AP 601', type:'apartment', chip:'AAA0239FCJZ', matricula:'050C01800650', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/602.pdf', name:'Balcones De Sajonia Apto 602', address:'KR 17 63 49 AP 602', type:'apartment', chip:'AAA0239FCKC', matricula:'050C01800651', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/701.pdf', name:'Balcones De Sajonia Apto 701', address:'KR 17 63 49 AP 701', type:'apartment', chip:'AAA0239FCLF', matricula:'050C01800652', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/703.pdf', name:'Balcones De Sajonia Apto 703', address:'KR 17 63 49 AP 703', type:'apartment', chip:'AAA0239FCNX', matricula:'050C01800654', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ1.pdf', name:'Balcones De Sajonia Garaje 1', address:'KR 17 63 49 GJ 1', type:'garage', chip:'AAA0239FCPA', matricula:'050C01800632', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ2.pdf', name:'Balcones De Sajonia Garaje 2', address:'KR 17 63 49 GJ 2', type:'garage', chip:'AAA0239FCRJ', matricula:'050C01800633', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ3.pdf', name:'Balcones De Sajonia Garaje 3', address:'KR 17 63 49 GJ 3', type:'garage', chip:'AAA0239FCSY', matricula:'050C01800634', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ4.pdf', name:'Balcones De Sajonia Garaje 4', address:'KR 17 63 49 GJ 4', type:'garage', chip:'AAA0239FCTD', matricula:'050C01800635', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ5.pdf', name:'Balcones De Sajonia Garaje 5', address:'KR 17 63 49 GJ 5', type:'garage', chip:'AAA0239FCFZ', matricula:'050C01800636', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ6.pdf', name:'Balcones De Sajonia Garaje 6', address:'KR 17 63 49 GJ 6', type:'garage', chip:'AAA0239FBXR', matricula:'050C01800637', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ7.pdf', name:'Balcones De Sajonia Garaje 7', address:'KR 17 63 49 GJ 7', type:'garage', chip:'AAA0239FCXS', matricula:'050C01800638', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'BalconesDeSajonia/GJ8.pdf', name:'Balcones De Sajonia Garaje 8', address:'KR 17 63 49 GJ 8', type:'garage', chip:'AAA0239FCWW', matricula:'050C01800639', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'CasaBarrancas.pdf', name:'Casa Barrancas', address:'CL 155A 7H 08', type:'house', chip:'AAA0109BKBS', matricula:'050N00318904', ownerName:'REYES APONTE BUITRAGO', ownerDoc:'19278127', ownerPct:'100%' },
  { file:'CasaChapinero3.pdf', name:'Casa Chapinero Agora', address:'KR 18 63A 25', type:'house', chip:'AAA0085TWZM', matricula:'050C00498009', ownerName:'MARIA ROSALBA NAVARRETE AREVALO / REYES APONTE BUITRAGO', ownerDoc:'39634531 / 19278127', ownerPct:'50% / 50%' },
  { file:'CasaFlandes.pdf', name:'Casa Flandes', address:'Mz 3 Cs 32 PARQUE TAYRONA I K 10 2', type:'house', chip:'', matricula:'', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'CasaGloria.pdf', name:'Casa Restrepo Gloria', address:'KR 19 20 20 SUR', type:'house', chip:'AAA0012CODE', matricula:'050S00125129', ownerName:'MARIA ROSALBA NAVARRETE AREVALO / REYES APONTE BUITRAGO', ownerDoc:'39634531 / 19278127', ownerPct:'50% / 50%' },
  { file:'CasaPastuso.pdf', name:'Casa Restrepo Exito', address:'CL 14 SUR 19 17', type:'house', chip:'AAA0012CTLW', matricula:'050S00693999', ownerName:'REYES APONTE BUITRAGO', ownerDoc:'19278127', ownerPct:'100%' },
  { file:'ChapineroPapas.pdf', name:'Chapinero San Luis', address:'KR 20 62 23', type:'house', chip:'AAA0083XOSK', matricula:'050C00112708', ownerName:'REYES APONTE BUITRAGO / MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'19278127 / 39634531', ownerPct:'50% / 50%' },
  { file:'Edificio Restrepo/Garage2.pdf', name:'Edificio Restrepo Garaje 2', address:'KR 19 19B 39 SUR GJ 2', type:'garage', chip:'AAA0170TFUZ', matricula:'050S40251084', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Garage3.pdf', name:'Edificio Restrepo Garaje 3', address:'KR 19 19B 39 SUR GJ 3', type:'garage', chip:'AAA0170TFWF', matricula:'050S40251085', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Garage4.pdf', name:'Edificio Restrepo Garaje 4', address:'KR 19 19B 39 SUR GJ 4', type:'garage', chip:'AAA0170TFXR', matricula:'050S40251086', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Garage5.pdf', name:'Edificio Restrepo Garaje 5', address:'KR 19 19B 39 SUR GJ 5', type:'garage', chip:'AAA0170TFYX', matricula:'050S40251087', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Garage6.pdf', name:'Edificio Restrepo Garaje 6', address:'KR 19 19B 39 SUR GJ 6', type:'garage', chip:'AAA0170TFZM', matricula:'050S40251088', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Garage7.pdf', name:'Edificio Restrepo Garaje 7', address:'KR 19 19B 39 SUR GJ 7', type:'garage', chip:'AAA0170THAF', matricula:'050S40251089', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Oficina201.pdf', name:'Edificio Restrepo Oficina 201', address:'KR 19 19B 39 SUR OF 201', type:'office', chip:'AAA0170THBR', matricula:'050S40251080', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Oficina301.pdf', name:'Edificio Restrepo Oficina 301', address:'KR 19 19B 39 SUR OF 301', type:'office', chip:'AAA0170THCX', matricula:'050S40251081', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Edificio Restrepo/Oficina401.pdf', name:'Edificio Restrepo Oficina 401', address:'KR 19 19B 39 SUR OF 401', type:'office', chip:'AAA0170THDM', matricula:'050S40251082', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'EdificioDalhom.pdf', name:'Edificio Dalhom', address:'KR 19 20 21 SUR', type:'local', chip:'AAA0012DCWF', matricula:'050S00415768', ownerName:'MARIA ROSALBA NAVARRETE AREVALO / REYES APONTE BUITRAGO', ownerDoc:'39634531 / 19278127', ownerPct:'50% / 50%' },
  { file:'LocalCaracas.pdf', name:'Local Caracas', address:'CL 51 SUR 9 30 LC 114', type:'local', chip:'AAA0009CPBR', matricula:'050S01096427', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'LocalJordan.pdf', name:'Local Restrepo Colchones', address:'KR 19 20 43 SUR LC 1', type:'local', chip:'AAA0012DCZM', matricula:'050S40319780', ownerName:'REYES APONTE BUITRAGO', ownerDoc:'19278127', ownerPct:'100%' },
  { file:'LocalOdontologa.pdf', name:'Local Restrepo Odontologa', address:'KR 19 20 30 SUR LC', type:'local', chip:'AAA0012CNUZ', matricula:'050S40169148', ownerName:'REYES APONTE BUITRAGO', ownerDoc:'19278127', ownerPct:'100%' },
  { file:'LocalSoacha.pdf', name:'Local Soacha', address:'CL 30 1 53 BQ 6', type:'local', chip:'', matricula:'', ownerName:'Maria Rosalba Navarrete Arevalo', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'MandalayCasaVecina.pdf', name:'Mandalay 2', address:'KR 78B 5C 25', type:'house', chip:'AAA0047RXDE', matricula:'050C00323677', ownerName:'REYES APONTE BUITRAGO', ownerDoc:'19278127', ownerPct:'100%' },
  { file:'MandalayPapás.pdf', name:'Mandalay 1', address:'KR 78B 5C 39', type:'house', chip:'AAA0047RXBS', matricula:'050C00424840', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Survana.pdf', name:'Survana', address:'KR 72 57B 50S IN 5 AP 302', type:'apartment', chip:'AAA0049EHKL', matricula:'050S40182636', ownerName:'MARIA ROSALBA NAVARRETE AREVALO', ownerDoc:'39634531', ownerPct:'100%' },
  { file:'Yomasa.pdf', name:'Yomasa', address:'CL 81 SUR 9A 18', type:'house', chip:'AAA0023UBDM', matricula:'050S00768411', ownerName:'REYES APONTE BUITRAGO', ownerDoc:'19278127', ownerPct:'100%' },
]

async function main() {
  console.log(`Importando ${propertiesData.length} propiedades...\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const p of propertiesData) {
    const existingChip = p.chip ? { chip: p.chip } : { address: p.address }

    const { data: existing } = await supabase
      .from('properties')
      .select('id, name')
      .match(existingChip)
      .maybeSingle()

    if (existing) {
      console.log(`  ↺ YA EXISTE [${existing.id.slice(0,8)}] ${p.name}`)
      skipped++
      continue
    }

    const insertData = {
      name: p.name,
      address: p.address,
      type: p.type,
      chip: p.chip || null,
      matricula: p.matricula || null,
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error(`  ✘ ERROR ${p.name}: ${error.message}`)
      errors++
      continue
    }

    const links = parseOwners(p.ownerName, p.ownerDoc, p.ownerPct)
    for (const link of links) {
      const { error: linkError } = await supabase
        .from('property_owners')
        .insert({ property_id: data.id, owner_id: link.owner_id, ownership_pct: link.ownership_pct })

      if (linkError) {
        console.error(`  ✘ ERROR al vincular dueño de ${p.name}: ${linkError.message}`)
        errors++
      }
    }

    console.log(`  ✔ CREADO [${data.id.slice(0,8)}] ${p.name} → dueño(s): ${links.length}`)
    created++
  }

  console.log(`\nResumen: ${created} creadas, ${skipped} saltadas, ${errors} errores`)
}

main().catch(console.error)
