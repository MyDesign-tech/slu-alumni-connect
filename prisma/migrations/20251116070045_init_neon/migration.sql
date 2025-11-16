-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUMNI', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('STEM', 'BUSINESS', 'HUMANITIES', 'HEALTHCARE', 'SOCIAL_SCIENCES');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'RETIRED', 'SEEKING', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'PENDING');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ALUMNI_REUNION', 'NETWORKING_MIXER', 'CAREER_FAIR', 'FUNDRAISING_GALA', 'WEBINAR', 'WORKSHOP', 'MENTORSHIP_PROGRAM', 'CLASS_REUNION');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'DECLINED', 'NOT_RESPONDED');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('YES', 'NO', 'NOT_YET');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ONE_TIME_GIFT', 'RECURRING_MONTHLY', 'PLEDGE', 'MAJOR_GIFT', 'IN_KIND');

-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'STOCK', 'WIRE_TRANSFER');

-- CreateEnum
CREATE TYPE "DonationPurpose" AS ENUM ('SCHOLARSHIP', 'GENERAL_FUND', 'ENDOWMENT', 'RESEARCH', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('COMPLETED', 'PENDING', 'DECLINED');

-- CreateEnum
CREATE TYPE "MentorshipArea" AS ENUM ('CAREER_DEVELOPMENT', 'ACADEMIC_GUIDANCE', 'NETWORKING', 'LEADERSHIP', 'ENTREPRENEURSHIP', 'TECHNICAL_SKILLS', 'PROFESSIONAL_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "EngagementTier" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ALUMNI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "graduationYear" INTEGER NOT NULL,
    "program" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "currentEmployer" TEXT,
    "jobTitle" TEXT,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'EMPLOYED',
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "budget" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "createdById" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvps" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'NOT_RESPONDED',
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "specialRequirements" TEXT,
    "checkInStatus" "CheckInStatus" NOT NULL DEFAULT 'NOT_YET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "donationType" "DonationType" NOT NULL,
    "donationMethod" "DonationMethod" NOT NULL,
    "purpose" "DonationPurpose" NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "taxDeductible" BOOLEAN NOT NULL DEFAULT true,
    "recurringFrequency" "RecurringFrequency",
    "status" "DonationStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "area" "MentorshipArea" NOT NULL,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'REQUESTED',
    "frequencyPerMonth" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "lastInteractionDate" TIMESTAMP(3),
    "satisfactionRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagements" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "eventsAttended" INTEGER NOT NULL DEFAULT 0,
    "donationCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmountDonated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mentorshipsActive" INTEGER NOT NULL DEFAULT 0,
    "volunteerHours" INTEGER NOT NULL DEFAULT 0,
    "emailEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "engagementTier" "EngagementTier" NOT NULL DEFAULT 'LOW',
    "assignedStaffId" TEXT,
    "lastReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_alumniId_eventId_key" ON "rsvps"("alumniId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "mentorships_mentorId_menteeId_key" ON "mentorships"("mentorId", "menteeId");

-- CreateIndex
CREATE UNIQUE INDEX "engagements_alumniId_key" ON "engagements"("alumniId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
