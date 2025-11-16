// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Mulai mengisi database...')

  // 1. BERSIHKAN DATA LAMA (Supaya tidak duplikat saat di-run ulang)
  await prisma.cardTemplate.deleteMany()
  await prisma.combatant.deleteMany()
  await prisma.gameRule.deleteMany()

  // 2. MASUKKAN GAME RULES (Konfigurasi Angka)
  // Ini sesuai penjelasanmu: Neutral=20, Monster=80, dll.
  await prisma.gameRule.createMany({
    data: [
      // Base Caps
      { key: 'cap_base_tier_1', value: 30, description: 'Batas awal Faint Memory di Tier 1' },
      { key: 'cap_tier_increment', value: 10, description: 'Penambahan batas per Tier' },
      
      // Card Costs
      { key: 'cost_neutral', value: 20, description: 'Biaya kartu Neutral' },
      { key: 'cost_monster', value: 80, description: 'Biaya kartu Monster' },
      { key: 'cost_forbidden', value: 20, description: 'Biaya kartu Forbidden' },
      
      // Epiphany Bonuses
      { key: 'bonus_epiphany', value: 10, description: 'Tambahan poin jika Epiphany' },
      { key: 'bonus_divine', value: 20, description: 'Tambahan poin jika Divine Epiphany' },
      
      // Action Costs (Conversion)
      { key: 'action_convert', value: 10, description: 'Biaya melakukan konversi kartu' },
      
      // Action Scaling (Disimpan sebagai JSON string karena berupa array)
      // Urutan cost: 0, 10, 30, 50, 70
      { key: 'scaling_duplication', value: 0, description: '0,10,30,50,70' }, 
      { key: 'scaling_removal', value: 0, description: '0,10,30,50,70' },
    ],
  })

  // 3. MASUKKAN DATA COMBATANT (Mika & Tressa)
  const mika = await prisma.combatant.create({
    data: {
      name: 'Mika',
      imageUrl: '/assets/mika_portrait.webp', // Placeholder
      cards: {
        create: [
          { name: 'Rapid Slash', type: 'Basic', cost: 0, description: 'Deal DMG.' },
          { name: 'Phantom Dance', type: 'Unique', cost: 0, description: 'Dodge next attack.' },
        ],
      },
    },
  })

  const tressa = await prisma.combatant.create({
    data: {
      name: 'Tressa',
      imageUrl: '/assets/tressa_portrait.webp', // Placeholder
      cards: {
        create: [
          { name: 'Snipe', type: 'Basic', cost: 0, description: 'Ranged DMG.' },
          { name: 'Command', type: 'Unique', cost: 0, description: 'Buff allies.' },
        ],
      },
    },
  })

  // 4. MASUKKAN KARTU UMUM (Neutral & Monster)
  await prisma.cardTemplate.createMany({
    data: [
      { 
        name: 'Abyssal Bug', 
        type: 'Neutral', 
        imageUrl: '/assets/abyssal_bug.webp',
        description: '-1 Morale, -3 Resolve (Exhaust)',
        tags: 'Exhaust'
      },
      { 
        name: 'Acid Gas', 
        type: 'Neutral', 
        imageUrl: '/assets/acid_gas.webp',
        description: 'Poison DMG to all enemies',
        tags: 'AoE'
      },
      { 
        name: 'Void Terror', 
        type: 'Monster', 
        imageUrl: '/assets/void_terror.webp',
        description: 'Huge DMG but high cost',
        cost: 3 // Cost energi ingame (bukan faint memory)
      },
    ],
  })

  console.log('Database berhasil diisi!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })