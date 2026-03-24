import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, pgEnum, jsonb, boolean, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userTypeEnum = pgEnum("user_type", ["student", "teacher", "admin", "deaf_student", "non_signer", "elderly_visually_challenged"]);
export const inputTypeEnum = pgEnum("input_type", ["webcam", "video", "image"]);
export const contentTypeEnum = pgEnum("content_type", ["text", "video", "sign"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: userTypeEnum("user_type").default("student"),
  profilePic: text("profile_pic"),
  preferences: jsonb("preferences").default({}),
  xp: integer("xp").default(0),
  streak: integer("streak").default(0),
  badges: jsonb("badges").default([]),
  emotionFlags: jsonb("emotion_flags").default({}),
  lastLoginDate: timestamp("last_login_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  teacherId: varchar("teacher_id").references(() => users.id),
  contentList: jsonb("content_list").default([]),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  title: text("title").notNull(),
  videoUrl: text("video_url"),
  captionsUrl: text("captions_url"),
  signVideoUrl: text("sign_video_url"),
  resources: jsonb("resources").default([]),
  order: integer("order").notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  questions: jsonb("questions").notNull(), // Array of objects { q, options, correct }
  type: text("type").default("visual"),
  difficulty: text("difficulty").default("intermediate"),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  completed: boolean("completed").default(false),
  score: integer("score"),
  streak: integer("streak").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
});

export const doubts = pgTable("doubts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  teacherId: varchar("teacher_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  questionType: contentTypeEnum("question_type").default("text"),
  content: text("content").notNull(),
  signVideoUrl: text("sign_video_url"),
  response: text("response"),
  status: text("status").default("pending"), // pending, answered
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id),
  receiverId: varchar("receiver_id").references(() => users.id),
  contentType: contentTypeEnum("content_type").default("text"),
  contentData: text("content_data").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  originalText: text("original_text"),
  translatedText: text("translated_text"),
  signVideoUrl: text("sign_video_url"),
  inputType: inputTypeEnum("input_type").default("webcam"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrolledCourses: many(enrollments),
  doubts: many(doubts),
  sentMessages: many(messages, { relationName: "sent" }),
  receivedMessages: many(messages, { relationName: "received" }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, { fields: [courses.teacherId], references: [users.id] }),
  lessons: many(lessons),
  enrollments: many(enrollments),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  quizzes: many(quizzes),
}));

export const doubtsRelations = relations(doubts, ({ one }) => ({
  user: one(users, { fields: [doubts.userId], references: [users.id] }),
  teacher: one(users, { fields: [doubts.teacherId], references: [users.id] }),
  course: one(courses, { fields: [doubts.courseId], references: [courses.id] }),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });
export const insertDoubtSchema = createInsertSchema(doubts).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true, lastActivity: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });

export type User = typeof users.$inferSelect;
export type UserType = typeof userTypeEnum.enumValues[number];
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Doubt = typeof doubts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Translation = typeof translations.$inferSelect;
