-- CreateEnum
CREATE TYPE "BackgroundCheckStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'SEARCHING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARD', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isDriver" BOOLEAN NOT NULL DEFAULT false,
    "isPassenger" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "userId" TEXT NOT NULL,
    "cnhNumber" TEXT NOT NULL,
    "cnhDocUrl" TEXT,
    "backgroundCheckStatus" "BackgroundCheckStatus" NOT NULL DEFAULT 'PENDING',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "mpUserId" TEXT,
    "mpAccessToken" TEXT,
    "mpRefreshToken" TEXT,
    "mpConnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rides" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "originAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "durationMin" DOUBLE PRECISION,
    "estimatedFare" DOUBLE PRECISION,
    "finalFare" DOUBLE PRECISION,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "routePolyline" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_driverId_idx" ON "vehicles"("driverId");

-- CreateIndex
CREATE INDEX "rides_passengerId_idx" ON "rides"("passengerId");

-- CreateIndex
CREATE INDEX "rides_driverId_idx" ON "rides"("driverId");

-- CreateIndex
CREATE INDEX "rides_status_idx" ON "rides"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_rideId_key" ON "payments"("rideId");

-- CreateIndex
CREATE INDEX "ratings_rideId_idx" ON "ratings"("rideId");

-- CreateIndex
CREATE INDEX "ratings_toUserId_idx" ON "ratings"("toUserId");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
