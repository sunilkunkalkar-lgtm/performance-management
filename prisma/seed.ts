import { PrismaClient, Role, CycleStatus, GoalStatus, GoalLevel, ReviewStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.competencyRating.deleteMany();
  await prisma.review.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.goalUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash("suii123", 10);

  const people = await prisma.department.create({ data: { name: "People" } });
  const engineering = await prisma.department.create({ data: { name: "Engineering" } });
  const product = await prisma.department.create({ data: { name: "Product" } });
  const design = await prisma.department.create({ data: { name: "Design" } });

  const priya = await prisma.user.create({
    data: {
      email: "priya@suii.app",
      passwordHash,
      name: "Priya Nair",
      title: "Head of People",
      role: Role.ADMIN,
      departmentId: people.id,
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: "marcus@suii.app",
      passwordHash,
      name: "Marcus Chen",
      title: "Engineering Manager",
      role: Role.MANAGER,
      departmentId: engineering.id,
      managerId: priya.id,
    },
  });

  const maya = await prisma.user.create({
    data: {
      email: "maya@suii.app",
      passwordHash,
      name: "Maya Okonkwo",
      title: "Design Manager",
      role: Role.MANAGER,
      departmentId: design.id,
      managerId: priya.id,
    },
  });

  const aisha = await prisma.user.create({
    data: {
      email: "aisha@suii.app",
      passwordHash,
      name: "Aisha Rahman",
      title: "Senior Software Engineer",
      role: Role.EMPLOYEE,
      departmentId: engineering.id,
      managerId: marcus.id,
    },
  });

  const samir = await prisma.user.create({
    data: {
      email: "samir@suii.app",
      passwordHash,
      name: "Samir Joshi",
      title: "Software Engineer",
      role: Role.EMPLOYEE,
      departmentId: engineering.id,
      managerId: marcus.id,
    },
  });

  const leo = await prisma.user.create({
    data: {
      email: "leo@suii.app",
      passwordHash,
      name: "Leo Park",
      title: "Product Designer",
      role: Role.EMPLOYEE,
      departmentId: design.id,
      managerId: maya.id,
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: "jordan@suii.app",
      passwordHash,
      name: "Jordan Hale",
      title: "Product Manager",
      role: Role.EMPLOYEE,
      departmentId: product.id,
      managerId: priya.id,
    },
  });

  const closed = await prisma.cycle.create({
    data: {
      name: "FY25 Annual Review",
      kind: "Annual",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2026-01-15"),
      status: CycleStatus.CLOSED,
    },
  });

  const active = await prisma.cycle.create({
    data: {
      name: "FY26 H1 Review",
      kind: "Mid-year",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-09-30"),
      status: CycleStatus.ACTIVE,
    },
  });

  await prisma.cycle.create({
    data: {
      name: "FY26 Annual Review",
      kind: "Annual",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-01-15"),
      status: CycleStatus.UPCOMING,
    },
  });

  const g1 = await prisma.goal.create({
    data: {
      ownerId: aisha.id,
      cycleId: active.id,
      title: "Ship reliability dashboard for production services",
      description:
        "Deliver a live reliability view covering latency, error budget, and incident MTTR for the core platform.",
      level: GoalLevel.INDIVIDUAL,
      metric: "Services instrumented",
      target: 8,
      current: 5,
      unit: "services",
      weight: 40,
      status: GoalStatus.ON_TRACK,
      dueDate: new Date("2026-09-15"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: aisha.id,
      cycleId: active.id,
      title: "Mentor two engineers through first on-call rotation",
      description: "Pair on runbooks, shadow two incidents, and complete a post-rotation retro.",
      level: GoalLevel.TEAM,
      metric: "Mentees completed",
      target: 2,
      current: 1,
      unit: "people",
      weight: 20,
      status: GoalStatus.ON_TRACK,
      dueDate: new Date("2026-09-30"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: samir.id,
      cycleId: active.id,
      title: "Reduce p95 API latency on checkout",
      description: "Profile hot paths and ship caching plus query improvements.",
      level: GoalLevel.INDIVIDUAL,
      metric: "p95 latency",
      target: 180,
      current: 240,
      unit: "ms",
      weight: 50,
      status: GoalStatus.AT_RISK,
      dueDate: new Date("2026-08-31"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: leo.id,
      cycleId: active.id,
      title: "Redesign performance review experience",
      description: "Ship a clearer self-review flow with competency rubrics and manager prompts.",
      level: GoalLevel.COMPANY,
      metric: "Prototype tests",
      target: 12,
      current: 9,
      unit: "sessions",
      weight: 35,
      status: GoalStatus.ON_TRACK,
      dueDate: new Date("2026-09-01"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: jordan.id,
      cycleId: active.id,
      title: "Launch H2 roadmap with measurable outcomes",
      description: "Align engineering, design, and people partners on three company bets.",
      level: GoalLevel.COMPANY,
      metric: "Bets documented",
      target: 3,
      current: 2,
      unit: "bets",
      weight: 40,
      status: GoalStatus.ON_TRACK,
      dueDate: new Date("2026-09-10"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: marcus.id,
      cycleId: active.id,
      title: "Raise team delivery predictability",
      description: "Keep sprint spillover under 15% and close review conversations on time.",
      level: GoalLevel.TEAM,
      metric: "Spillover",
      target: 15,
      current: 18,
      unit: "%",
      weight: 30,
      status: GoalStatus.AT_RISK,
      dueDate: new Date("2026-09-30"),
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: maya.id,
      cycleId: active.id,
      title: "Establish design quality bar for Suii product",
      description: "Publish a design system slice covering reviews, goals, and feedback.",
      level: GoalLevel.TEAM,
      metric: "Components shipped",
      target: 24,
      current: 24,
      unit: "components",
      weight: 25,
      status: GoalStatus.COMPLETED,
      dueDate: new Date("2026-08-15"),
    },
  });

  await prisma.goalUpdate.create({
    data: {
      goalId: g1.id,
      authorId: aisha.id,
      note: "Error budget burn charts are live for five services. Next: incident MTTR annotations.",
      progress: 5,
    },
  });

  const competencies = [
    "Impact",
    "Collaboration",
    "Craft",
    "Ownership",
    "Growth",
  ];

  async function createReview(
    employeeId: string,
    managerId: string,
    status: ReviewStatus,
    extras: Partial<{
      selfSummary: string;
      managerSummary: string;
      selfRating: number;
      managerRating: number;
    }> = {},
  ) {
    const review = await prisma.review.create({
      data: {
        cycleId: active.id,
        employeeId,
        managerId,
        status,
        selfSummary: extras.selfSummary ?? "",
        managerSummary: extras.managerSummary ?? "",
        selfRating: extras.selfRating,
        managerRating: extras.managerRating,
      },
    });
    await prisma.competencyRating.createMany({
      data: competencies.map((name) => ({ reviewId: review.id, name })),
    });
    return review;
  }

  const aishaReview = await createReview(aisha.id, marcus.id, ReviewStatus.SELF_REVIEW, {
    selfSummary:
      "I led reliability instrumentation for five services and started mentoring Samir through on-call. I want to finish MTTR views before the cycle closes.",
    selfRating: 4,
  });

  await prisma.competencyRating.updateMany({
    where: { reviewId: aishaReview.id, name: "Impact" },
    data: { selfScore: 4 },
  });
  await prisma.competencyRating.updateMany({
    where: { reviewId: aishaReview.id, name: "Craft" },
    data: { selfScore: 5 },
  });
  await prisma.competencyRating.updateMany({
    where: { reviewId: aishaReview.id, name: "Ownership" },
    data: { selfScore: 4 },
  });

  await createReview(samir.id, marcus.id, ReviewStatus.NOT_STARTED);
  await createReview(leo.id, maya.id, ReviewStatus.MANAGER_REVIEW, {
    selfSummary: "Completed usability tests on the review flow. Waiting on engineering capacity for the remaining polish.",
    selfRating: 4,
  });
  await createReview(jordan.id, priya.id, ReviewStatus.NOT_STARTED);
  await createReview(marcus.id, priya.id, ReviewStatus.SELF_REVIEW, {
    selfSummary: "Team is shipping, but spillover is still above the bar. Coaching Samir on estimation is my focus.",
    selfRating: 3,
  });
  await createReview(maya.id, priya.id, ReviewStatus.COMPLETED, {
    selfSummary: "Design system slice is complete and adopted by product.",
    managerSummary: "Maya set a high quality bar and unblocked the H1 review experience. Strong exceed on craft.",
    selfRating: 5,
    managerRating: 5,
  });

  await prisma.review.create({
    data: {
      cycleId: closed.id,
      employeeId: aisha.id,
      managerId: marcus.id,
      status: ReviewStatus.COMPLETED,
      selfSummary: "Closed the year with the platform migration.",
      managerSummary: "Consistently high impact. Ready for broader technical leadership.",
      selfRating: 4,
      managerRating: 5,
    },
  });

  await prisma.feedback.createMany({
    data: [
      {
        fromId: marcus.id,
        toId: aisha.id,
        message:
          "The reliability charts you showed in the ops review made incident tradeoffs obvious. That is the kind of leadership I want more of.",
      },
      {
        fromId: samir.id,
        toId: aisha.id,
        message: "Thanks for walking me through the on-call runbook. I felt ready for the first shadow shift.",
      },
      {
        fromId: jordan.id,
        toId: leo.id,
        message: "The prototype for self-review cut our PM confusion in half. Let's keep the rubric language this clear.",
      },
      {
        fromId: priya.id,
        toId: maya.id,
        message: "Design quality on Suii is now a company advantage. Thank you for holding the bar.",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
