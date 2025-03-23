/*
  Warnings:

  - You are about to drop the `Donation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'EMAIL', 'DATE', 'CHECKBOX', 'SELECT', 'MULTISELECT', 'FILE', 'TEXTAREA');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Otp" DROP CONSTRAINT "Otp_userId_fkey";

-- DropForeignKey
ALTER TABLE "Password" DROP CONSTRAINT "Password_userId_fkey";

-- DropTable
DROP TABLE "Donation";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "token_v" INTEGER NOT NULL DEFAULT 0,
    "additional_info" JSONB,
    "roleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formfields" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "fieldType" "FieldType" NOT NULL DEFAULT 'TEXT',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "validations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formfields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "embeddings" vector(1024) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_on_form" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_field_on_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_values" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "formfields_label_key" ON "formfields"("label");

-- CreateIndex
CREATE UNIQUE INDEX "form_field_on_form_formId_fieldId_key" ON "form_field_on_form"("formId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "form_values_submissionId_fieldId_key" ON "form_values"("submissionId", "fieldId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_on_form" ADD CONSTRAINT "form_field_on_form_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field_on_form" ADD CONSTRAINT "form_field_on_form_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "formfields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_values" ADD CONSTRAINT "form_values_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_values" ADD CONSTRAINT "form_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "formfields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
