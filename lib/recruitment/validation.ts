import { z } from "zod";
import { normalizePhone } from "./domain";
const id = z.string().uuid(),
  optionalId = id.nullable().optional();
export const settingsSchema = z.object({
  companyName: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  description: z.string().max(5000),
  website: z.string().url().or(z.literal("")),
  replyTo: z.string().email(),
  matching: z.enum(["email", "phone", "either"]),
  offerApprover: optionalId,
  enabled: z.boolean(),
  publicEnabled: z.boolean(),
});
export const interviewSchema = z.object({
  title: z.string().trim().min(1).max(150),
  startsAt: z.string().datetime(),
  duration: z.number().int().min(10).max(480),
  timezone: z.string().refine((v) => {
    try {
      Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }),
  location: z.string().trim().min(1).max(1000),
  instructions: z.string().max(5000),
  interviewerIds: z.array(id).min(1).max(20),
  replacesId: optionalId,
});
export const offerSchema = z.object({
  title: z.string().trim().min(1).max(150),
  location: z.string().trim().min(1).max(200),
  employmentType: z.enum([
    "permanent",
    "contract",
    "part_time",
    "internship",
    "freelance",
  ]),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiresAt: z.string().datetime(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  salary: z.number().nonnegative(),
  payPeriod: z.enum(["hour", "day", "month", "year"]),
  terms: z.string().trim().min(10).max(20000),
  components: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(150),
        amount: z.number().nonnegative(),
      }),
    )
    .max(30)
    .default([]),
});
export const hireSchema = z.object({
  roleId: id,
  jobTitleId: id,
  departmentId: optionalId,
  branchId: optionalId,
  supervisorId: optionalId,
  employmentType: offerSchema.shape.employmentType,
  joinDate: offerSchema.shape.joinDate,
  documentIds: z.array(id).max(50).default([]),
  salaryAssignments: z
    .array(z.object({ componentId: id, amount: z.number().nonnegative() }))
    .max(30)
    .default([]),
});
export const restrictionSchema = z.object({
  businessCandidateId: optionalId,
  email: z.string().email().or(z.literal("")).optional(),
  phone: z
    .string()
    .transform((v) => (v ? normalizePhone(v) : ""))
    .optional(),
  reason: z.string().trim().min(3).max(2000),
  evidence: z.string().max(5000).optional(),
  expiresAt: z.string().datetime().nullable(),
  active: z.boolean().optional(),
});
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().transform(normalizePhone),
});
export const simpleCommands = {
  stage: z.object({
    stage: z.enum([
      "applied",
      "screening",
      "shortlisted",
      "interview",
      "rejected",
    ]),
    reason: z.string().max(2000).default(""),
    message: z.string().max(5000).default(""),
  }),
  reopen: z.object({
    stage: z.literal("screening"),
    reason: z.string().trim().min(3).max(2000),
  }),
  assign: z.object({ recruiterId: optionalId }),
  note: z.object({ message: z.string().trim().min(1).max(5000) }),
  document_request: z.object({
    label: z.string().trim().min(1).max(150),
    instructions: z.string().max(2000).default(""),
    deadline: z.string().datetime().nullable(),
  }),
  restriction_review: z.object({
    restrictionId: id,
    disposition: z.enum(["different_person", "override", "confirmed"]),
    reason: z.string().trim().min(3).max(2000),
  }),
  interview_status: z.object({
    status: z.enum(["completed", "cancelled", "no_show"]),
  }),
  feedback: z.object({
    recommendation: z.enum(["strong_yes", "yes", "no", "strong_no"]),
    score: z.number().int().min(1).max(5),
    notes: z.string().trim().min(1).max(5000),
  }),
  candidate_match_review: z.object({
    candidateId: id,
    matchedId: id,
    disposition: z.enum([
      "different_person",
      "same_person",
      "needs_correction",
    ]),
    reason: z.string().trim().min(3).max(2000),
  }),
  manual_candidate: profileSchema.extend({
    email: z.string().email(),
    source: z.enum(["referral", "walk_in"]),
  }),
};
