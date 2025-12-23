-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "radius" REAL DEFAULT 100.0,
    "authorizedIPs" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" DATETIME,
    "address" TEXT,
    "employeeCode" TEXT,
    "position" TEXT,
    "function" TEXT,
    "contractType" TEXT,
    "hireDate" DATETIME,
    "dismissalDate" DATETIME,
    "salary" REAL,
    "workScheduleId" TEXT,
    "workHours" REAL DEFAULT 8.0,
    "workDays" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'employee',
    "canRegisterPoint" BOOLEAN NOT NULL DEFAULT true,
    "qrCode" TEXT,
    "qrCodeExpiresAt" DATETIME,
    "biometricId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "hourBalance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Employee_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "workDays" TEXT NOT NULL,
    "workHours" REAL NOT NULL DEFAULT 8.0,
    "startTime" TEXT,
    "endTime" TEXT,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "breakDuration" INTEGER,
    "minHours" REAL,
    "maxHours" REAL,
    "shiftDays" INTEGER,
    "restDays" INTEGER,
    "allowOvertime" BOOLEAN NOT NULL DEFAULT true,
    "maxOvertime" REAL,
    "tolerance" INTEGER DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeClock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "branchId" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "ipAddress" TEXT,
    "method" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validationMessage" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "justificationId" TEXT,
    "adjustedBy" TEXT,
    "adjustedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimeClock_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimeClock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeClock_justificationId_fkey" FOREIGN KEY ("justificationId") REFERENCES "Justification" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Justification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "startTime" TEXT,
    "endTime" TEXT,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Justification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HourAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hours" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HourAdjustment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'national',
    "state" TEXT,
    "city" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holiday_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "requireGeolocation" BOOLEAN NOT NULL DEFAULT false,
    "requireIPValidation" BOOLEAN NOT NULL DEFAULT false,
    "allowManualEntry" BOOLEAN NOT NULL DEFAULT true,
    "allowQRCode" BOOLEAN NOT NULL DEFAULT true,
    "delayTolerance" INTEGER NOT NULL DEFAULT 5,
    "earlyExitTolerance" INTEGER NOT NULL DEFAULT 5,
    "notifyMissingPoint" BOOLEAN NOT NULL DEFAULT true,
    "notifyOvertime" BOOLEAN NOT NULL DEFAULT true,
    "notifyDelays" BOOLEAN NOT NULL DEFAULT true,
    "autoCalculateOvertime" BOOLEAN NOT NULL DEFAULT true,
    "autoCompensateHours" BOOLEAN NOT NULL DEFAULT false,
    "requireDigitalSignature" BOOLEAN NOT NULL DEFAULT false,
    "signatureKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "usedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QRCode_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QRCode_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeClockAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeClockAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE INDEX "Company_isActive_idx" ON "Company"("isActive");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Branch_isActive_idx" ON "Branch"("isActive");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cpf_key" ON "Employee"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_qrCode_key" ON "Employee"("qrCode");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_cpf_idx" ON "Employee"("cpf");

-- CreateIndex
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "WorkSchedule_companyId_idx" ON "WorkSchedule"("companyId");

-- CreateIndex
CREATE INDEX "WorkSchedule_isActive_idx" ON "WorkSchedule"("isActive");

-- CreateIndex
CREATE INDEX "TimeClock_employeeId_idx" ON "TimeClock"("employeeId");

-- CreateIndex
CREATE INDEX "TimeClock_branchId_idx" ON "TimeClock"("branchId");

-- CreateIndex
CREATE INDEX "TimeClock_type_idx" ON "TimeClock"("type");

-- CreateIndex
CREATE INDEX "TimeClock_timestamp_idx" ON "TimeClock"("timestamp");

-- CreateIndex
CREATE INDEX "TimeClock_isValid_idx" ON "TimeClock"("isValid");

-- CreateIndex
CREATE INDEX "TimeClock_createdAt_idx" ON "TimeClock"("createdAt");

-- CreateIndex
CREATE INDEX "Justification_employeeId_idx" ON "Justification"("employeeId");

-- CreateIndex
CREATE INDEX "Justification_type_idx" ON "Justification"("type");

-- CreateIndex
CREATE INDEX "Justification_status_idx" ON "Justification"("status");

-- CreateIndex
CREATE INDEX "Justification_startDate_idx" ON "Justification"("startDate");

-- CreateIndex
CREATE INDEX "Justification_createdAt_idx" ON "Justification"("createdAt");

-- CreateIndex
CREATE INDEX "HourAdjustment_employeeId_idx" ON "HourAdjustment"("employeeId");

-- CreateIndex
CREATE INDEX "HourAdjustment_type_idx" ON "HourAdjustment"("type");

-- CreateIndex
CREATE INDEX "HourAdjustment_status_idx" ON "HourAdjustment"("status");

-- CreateIndex
CREATE INDEX "HourAdjustment_createdAt_idx" ON "HourAdjustment"("createdAt");

-- CreateIndex
CREATE INDEX "Holiday_companyId_idx" ON "Holiday"("companyId");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_type_idx" ON "Holiday"("type");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_token_key" ON "QRCode"("token");

-- CreateIndex
CREATE INDEX "QRCode_employeeId_idx" ON "QRCode"("employeeId");

-- CreateIndex
CREATE INDEX "QRCode_branchId_idx" ON "QRCode"("branchId");

-- CreateIndex
CREATE INDEX "QRCode_code_idx" ON "QRCode"("code");

-- CreateIndex
CREATE INDEX "QRCode_token_idx" ON "QRCode"("token");

-- CreateIndex
CREATE INDEX "QRCode_expiresAt_idx" ON "QRCode"("expiresAt");

-- CreateIndex
CREATE INDEX "QRCode_isUsed_idx" ON "QRCode"("isUsed");

-- CreateIndex
CREATE INDEX "TimeClockAuditLog_userId_idx" ON "TimeClockAuditLog"("userId");

-- CreateIndex
CREATE INDEX "TimeClockAuditLog_action_idx" ON "TimeClockAuditLog"("action");

-- CreateIndex
CREATE INDEX "TimeClockAuditLog_entityType_idx" ON "TimeClockAuditLog"("entityType");

-- CreateIndex
CREATE INDEX "TimeClockAuditLog_entityId_idx" ON "TimeClockAuditLog"("entityId");

-- CreateIndex
CREATE INDEX "TimeClockAuditLog_createdAt_idx" ON "TimeClockAuditLog"("createdAt");
