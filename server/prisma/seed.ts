import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const password = await bcrypt.hash('engineer123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'engineer@eleccalc.pro' },
    update: {},
    create: {
      email: 'engineer@eleccalc.pro',
      password,
      name: 'Demo Engineer',
      company: 'ElecCalc Pro Demo',
      role: 'engineer',
      settings: {
        create: {
          theme: 'dark',
          unitSystem: 'metric',
          standard: 'IEC',
          engineerName: 'Demo Engineer',
          companyName: 'ElecCalc Pro Demo',
          autoSave: true,
        },
      },
    },
  });

  console.log(`✅ Created demo user: ${user.email} (password: engineer123)`);

  const project = await prisma.project.upsert({
    where: { id: 'demo-project-001' },
    update: {},
    create: {
      id: 'demo-project-001',
      name: 'Industrial Plant 11kV Substation',
      client: 'ABC Manufacturing Ltd.',
      engineer: 'Demo Engineer',
      projectNo: 'EPC-2024-001',
      revision: 'B',
      date: new Date().toISOString().split('T')[0],
      companyName: 'ElecCalc Pro Demo',
      description: 'Design of 11kV/415V distribution substation for industrial facility, 2 MVA capacity.',
      userId: user.id,
    },
  });

  console.log(`✅ Created demo project: ${project.name}`);

  // Sample calculations
  const sampleCalcs = [
    {
      projectId: project.id,
      type: 'cable-sizing',
      title: 'MDB Incomer Cable — 1000A, Cu XLPE on Tray',
      inputs: JSON.stringify({ current: 800, conductor: 'Cu', insulation: 'XLPE', installMethod: 'T', ambientTemp: 40, numCables: 3, groupMethod: 'tray', futureFactor: 1.25 }),
      results: JSON.stringify({
        values: [{ label: 'Selected Cable Size', value: '300 mm²', unit: '', highlight: true }, { label: 'Derated Ampacity', value: '387.6', unit: 'A' }],
        status: 'PASS',
        recommendation: 'Recommended: 300 mm² Cu XLPE 3-core armoured cable',
        formula: 'I_z = I_t × C_f × C_g',
        steps: [],
        standardRef: { standard: 'IEC 60364-5-52', clause: 'Table B.52.2', title: 'Wiring systems' },
      }),
      notes: 'Main incomer cable from transformer LV terminals to MDB',
      standard: 'IEC 60364-5-52',
    },
    {
      projectId: project.id,
      type: 'short-circuit',
      title: 'Short Circuit at MDB — 11kV, 1MVA Transformer',
      inputs: JSON.stringify({ voltage: 0.415, transformerMVA: 1.0, transformerImpedance: 6, faultType: '3ph' }),
      results: JSON.stringify({
        values: [{ label: 'Symmetrical Fault Current', value: '23.5', unit: 'kA', highlight: true }],
        status: 'PASS',
        recommendation: 'Fault current 23.5 kA — specify switchgear rated ≥ 25 kA',
        formula: 'I"_k3 = c × Un / (√3 × Zk)',
        steps: [],
        standardRef: { standard: 'IEC 60909', clause: '4.2', title: 'Short-circuit currents' },
      }),
      notes: 'Fault level at MDB incoming terminals — basis for switchgear rating',
      standard: 'IEC 60909',
    },
    {
      projectId: project.id,
      type: 'motor',
      title: 'Motor — 75kW Pump, DOL Start',
      inputs: JSON.stringify({ kw: 75, voltage: 415, phases: 3, powerFactor: 0.87, efficiency: 0.93, startingMethod: 'DOL' }),
      results: JSON.stringify({
        values: [{ label: 'Full Load Current', value: '136.2', unit: 'A', highlight: true }, { label: 'Starting Current (DOL)', value: '817.2', unit: 'A' }],
        status: 'INFO',
        recommendation: '75kW motor FLC = 136.2A. OLR set 143A. MCCB 400A. Cable: 95mm² Cu XLPE',
        formula: 'I_FLC = P / (√3 × V × cosφ × η)',
        steps: [],
        standardRef: { standard: 'IEC 60947-4-1', clause: '5.3.2', title: 'Motor starters' },
      }),
      notes: 'Main cooling water pump motor',
      standard: 'IEC 60947-4-1',
    },
  ];

  for (const calc of sampleCalcs) {
    await prisma.calculation.create({ data: calc });
  }

  console.log(`✅ Created ${sampleCalcs.length} sample calculations`);
  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Email:    engineer@eleccalc.pro');
  console.log('  Password: engineer123\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
