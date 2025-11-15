import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
