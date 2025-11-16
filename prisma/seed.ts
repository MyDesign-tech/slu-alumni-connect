import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import alumniRows from '../src/data/slu_alumni_data.json'

const prisma = new PrismaClient()

const VALID_DEPARTMENTS = ['STEM', 'BUSINESS', 'HUMANITIES', 'HEALTHCARE', 'SOCIAL_SCIENCES'] as const

function mapDepartment(rawDepartment?: string, program?: string) {
  if (rawDepartment) {
    const normalized = rawDepartment.toUpperCase().replace(/\s+/g, '_')
    if (VALID_DEPARTMENTS.includes(normalized as (typeof VALID_DEPARTMENTS)[number])) {
      return normalized
    }
  }

  if (program) {
    const p = program.toLowerCase()
    if (p.includes('computer') || p.includes('engineering')) return 'STEM'
    if (p.includes('business')) return 'BUSINESS'
    if (p.includes('medicine') || p.includes('nursing') || p.includes('health')) return 'HEALTHCARE'
    if (p.includes('social')) return 'SOCIAL_SCIENCES'
  }

  return 'HUMANITIES'
}

function mapEmploymentStatus(rawStatus?: string) {
  if (!rawStatus) return 'NOT_AVAILABLE'
  const s = rawStatus.toLowerCase()
  if (s === 'employed') return 'EMPLOYED'
  if (s === 'self-employed' || s === 'self employed') return 'SELF_EMPLOYED'
  if (s === 'retired') return 'RETIRED'
  if (s === 'seeking') return 'SEEKING'
  return 'NOT_AVAILABLE'
}

function mapVerificationStatus(rawStatus?: string) {
  if (!rawStatus) return 'PENDING'
  const s = rawStatus.toLowerCase()
  if (s === 'verified') return 'VERIFIED'
  if (s === 'unverified') return 'UNVERIFIED'
  return 'PENDING'
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@slu.edu' },
    update: {},
    create: {
      email: 'admin@slu.edu',
      password: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          graduationYear: 2020,
          program: 'Administration',
          department: 'STEM',
          profileCompleteness: 100,
          country: 'USA',
        }
      }
    },
    include: {
      profile: true
    }
  })

  // Create John Doe user
  const johnPassword = await bcrypt.hash('password123', 12)
  const john = await prisma.user.upsert({
    where: { email: 'john.doe@slu.edu' },
    update: {},
    create: {
      email: 'john.doe@slu.edu',
      password: johnPassword,
      role: 'ALUMNI',
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          graduationYear: 2020,
          program: 'Computer Science',
          department: 'STEM',
          profileCompleteness: 85,
          country: 'USA',
          city: 'St. Louis',
          state: 'MO',
          currentEmployer: 'Tech Corp',
          jobTitle: 'Software Engineer',
          bio: 'Passionate software engineer with expertise in web development.'
        }
      }
    },
    include: {
      profile: true
    }
  })

  // Create Sarah Johnson user
  const sarahPassword = await bcrypt.hash('password123', 12)
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.johnson@slu.edu' },
    update: {},
    create: {
      email: 'sarah.johnson@slu.edu',
      password: sarahPassword,
      role: 'ALUMNI',
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          graduationYear: 2018,
          program: 'Business Administration',
          department: 'BUSINESS',
          profileCompleteness: 90,
          country: 'USA',
          city: 'Chicago',
          state: 'IL',
          currentEmployer: 'Google',
          jobTitle: 'Product Manager',
          bio: 'Product manager passionate about user experience and innovation.'
        }
      }
    },
    include: {
      profile: true
    }
  })

  console.log(`✅ Created admin user: ${admin.email}`)
  console.log(`✅ Created user: ${john.email}`)
  console.log(`✅ Created user: ${sarah.email}`)

  // Import all alumni from JSON (converted from CSV) as real users
  const alumniPasswordHash = await bcrypt.hash('password123', 12)
  const alumniData = alumniRows as any[]

  let importedCount = 0

  for (const row of alumniData) {
    const email = row.Email as string | undefined
    if (!email) {
      continue
    }

    // Skip if user already exists (seed is re-run)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      continue
    }

    const graduationYear = parseInt(row.GraduationYear) || 0
    const department = mapDepartment(row.Department, row.Program)
    const employmentStatus = mapEmploymentStatus(row.EmploymentStatus)
    const verificationStatus = mapVerificationStatus(row.VerificationStatus)

    await prisma.user.create({
      data: {
        email,
        password: alumniPasswordHash,
        role: 'ALUMNI',
        profile: {
          create: {
            firstName: row.FirstName || 'Unknown',
            lastName: row.LastName || 'Unknown',
            phone: row.Phone || null,
            graduationYear,
            program: row.Program || 'Unknown',
            department: department as any,
            currentEmployer: row.CurrentEmployer || null,
            jobTitle: row.JobTitle || null,
            employmentStatus: employmentStatus as any,
            city: row.Location_City || null,
            state: row.Location_State || null,
            country: row.Location_Country || 'USA',
            verificationStatus: verificationStatus as any,
            profileCompleteness: parseInt(row.ProfileCompleteness) || 0,
          },
        },
      },
    })

    importedCount += 1
  }

  console.log(`✅ Imported ${importedCount} alumni from dataset (default password: password123)`) 

  console.log('🎉 Database seeding completed!')
  console.log('\n📋 Demo Credentials:')
  console.log('👨‍💼 Admin: admin@slu.edu / admin123')
  console.log('👤 User: john.doe@slu.edu / password123')
  console.log('👤 User: sarah.johnson@slu.edu / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
