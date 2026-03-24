import {
  users, translations, courses, lessons, enrollments, quizzes, doubts, progress, messages,
  type User, type Course, type Lesson, type Enrollment, type Quiz, type Doubt, type Progress, type Message, type Translation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { log } from "./index";

export interface IStorage {
  // User Methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, data: any): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // DHH Platform Methods
  getCourses(): Promise<Course[]>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: any): Promise<Course>;
  updateCourse(id: number, data: any): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;

  getLessons(courseId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: any): Promise<Lesson>;
  updateLesson(id: number, data: any): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<void>;

  getEnrollments(userId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollment(userId: string, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: any): Promise<Enrollment>;

  getDoubts(filter: { studentId?: string, teacherId?: string }): Promise<Doubt[]>;
  createDoubt(doubt: any): Promise<Doubt>;
  updateDoubt(id: number, data: any): Promise<Doubt | undefined>;

  // Messaging
  createMessage(message: any): Promise<Message>;
  getMessages(userId: string, otherId: string): Promise<Message[]>;

  // Progress
  updateProgress(progress: any): Promise<Progress>;
  getProgress(userId: string, courseId: number): Promise<Progress[]>;
  getAllProgress(userId: string): Promise<Progress[]>;

  // Quizzes
  getQuizzesByCourse(courseId: number): Promise<Quiz[]>;
  getQuizzesByLesson(lessonId: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: any): Promise<Quiz>;
  submitQuizResult(userId: string, courseId: number, lessonId: number, score: number): Promise<Progress>;

  // AI & Translation
  getTranslation(id: string): Promise<Translation | undefined>;
  createTranslation(translation: any): Promise<Translation>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: any): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId)).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(insertCourse: any): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: number, data: any): Promise<Course | undefined> {
    const [course] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return course || undefined;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getLessons(courseId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createLesson(insertLesson: any): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(insertLesson).returning();
    return lesson;
  }

  async updateLesson(id: number, data: any): Promise<Lesson | undefined> {
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson || undefined;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async getEnrollments(userId: string): Promise<any[]> {
    const results = await db
      .select({
        enrollment: enrollments,
        course: courses
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId));

    return results.map(r => ({
      ...r.enrollment,
      course: r.course
    }));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<any[]> {
    const results = await db
      .select({
        enrollment: enrollments,
        student: users
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.courseId, courseId));

    return results.map(r => ({
      ...r.enrollment,
      student: r.student
    }));
  }

  async getEnrollment(userId: string, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment || undefined;
  }

  async createEnrollment(insertEnrollment: any): Promise<Enrollment> {
    const existing = await this.getEnrollment(insertEnrollment.userId, insertEnrollment.courseId);
    if (existing) return existing;

    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  async getDoubts(filter: { studentId?: string, teacherId?: string }): Promise<any[]> {
    const conditions = [];
    if (filter.studentId) conditions.push(eq(doubts.userId, filter.studentId));
    if (filter.teacherId) conditions.push(eq(doubts.teacherId, filter.teacherId));

    const results = await db
      .select({
        doubt: doubts,
        student: users
      })
      .from(doubts)
      .leftJoin(users, eq(doubts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(doubts.createdAt));

    return results.map(r => ({
      ...r.doubt,
      student: r.student
    }));
  }

  async createDoubt(insertDoubt: any): Promise<Doubt> {
    const [doubt] = await db.insert(doubts).values(insertDoubt).returning();
    return doubt;
  }

  async updateDoubt(id: number, data: any): Promise<Doubt | undefined> {
    const [doubt] = await db.update(doubts).set(data).where(eq(doubts.id, id)).returning();
    return doubt || undefined;
  }

  async createMessage(insertMessage: any): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessages(userId: string, otherId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherId)),
          and(eq(messages.senderId, otherId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.timestamp);
  }

  async updateProgress(insertProgress: any): Promise<Progress> {
    const [existing] = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, insertProgress.userId),
          eq(progress.courseId, insertProgress.courseId),
          eq(progress.lessonId, insertProgress.lessonId)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(progress)
        .set(insertProgress)
        .where(eq(progress.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(progress).values(insertProgress).returning();
    return created;
  }

  async getProgress(userId: string, courseId: number): Promise<Progress[]> {
    return await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.courseId, courseId)));
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    return await db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId));
  }

  async getQuizzesByCourse(courseId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async getQuizzesByLesson(lessonId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async createQuiz(insertQuiz: any): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(insertQuiz).returning();
    return quiz;
  }

  async submitQuizResult(userId: string, courseId: number, lessonId: number, score: number): Promise<Progress> {
    return await this.updateProgress({
      userId,
      courseId,
      lessonId,
      score,
      completed: true,
      lastActivity: new Date()
    });
  }

  async getTranslation(id: string): Promise<Translation | undefined> {
    const [translation] = await db.select().from(translations).where(eq(translations.id, id));
    return translation || undefined;
  }

  async createTranslation(insertTranslation: any): Promise<Translation> {
    const [translation] = await db.insert(translations).values(insertTranslation).returning();
    return translation;
  }

  async seed() {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      log("Seeding initial database data...");
      const hashedPassword = await bcrypt.hash("password123", 10);

      const [admin, teacher1, teacher2, student1, student2, student3] = await db.insert(users).values([
        { name: "Admin User", email: "admin@accessedu.org", username: "admin", password: hashedPassword, userType: "admin" },
        { name: "Sarah Teacher", email: "teacher1@accessedu.org", username: "teacher1", password: hashedPassword, userType: "teacher" },
        { name: "John Instructor", email: "teacher2@accessedu.org", username: "teacher2", password: hashedPassword, userType: "teacher" },
        { name: "Alex Student", email: "student1@accessedu.org", username: "student1", password: hashedPassword, userType: "deaf_student" },
        { name: "Bela Student", email: "student2@accessedu.org", username: "student2", password: hashedPassword, userType: "non_signer" },
        { name: "Charlie Student", email: "student3@accessedu.org", username: "student3", password: hashedPassword, userType: "student" },
      ]).returning();

      const [course1, course2] = await db.insert(courses).values([
        { title: "Introduction to ASL", description: "Learn the basics of American Sign Language.", teacherId: teacher1.id, tags: ["language", "asl"] },
        { title: "Advanced Space Science", description: "Explore the galaxies and stellar evolution.", teacherId: teacher2.id, tags: ["science", "space"] }
      ]).returning();

      const [lesson1, lesson2, lesson3] = await db.insert(lessons).values([
        { courseId: course1.id, title: "The Alphabet", order: 1, videoUrl: "/videos/alphabet.mp4" },
        { courseId: course1.id, title: "Common Greetings", order: 2, videoUrl: "/videos/greetings.mp4" },
        { courseId: course2.id, title: "Solar System", order: 1, videoUrl: "/videos/solar_system.mp4" }
      ]).returning();

      await db.insert(quizzes).values([
        {
          courseId: course1.id,
          lessonId: lesson1.id,
          questions: [
            { q: "What is the sign for 'A'?", options: ["Clenched fist with thumb on side", "Open hand", "Two fingers up"], correct: 0 },
            { q: "Which hand is used for signing?", options: ["Left only", "Dominant hand", "Both equally"], correct: 1 }
          ],
          type: "visual",
          difficulty: "beginner"
        },
        {
          courseId: course2.id,
          lessonId: lesson3.id,
          questions: [
            { q: "Which planet is known as the 'Red Planet'?", options: ["Mars", "Venus", "Jupiter"], correct: 0 }
          ],
          type: "visual",
          difficulty: "intermediate"
        }
      ]);

      await db.insert(progress).values([
        { userId: student1.id, courseId: course1.id, lessonId: lesson1.id, completed: true, score: 90, streak: 1 }
      ]);

      await db.insert(messages).values([
        { senderId: teacher1.id, receiverId: student1.id, contentData: "Welcome to the ASL course!" }
      ]);

      log("Database seeding completed.");
    }
  }
}

export class MemStorage implements IStorage {
    private _users = new Map<string, User>();
    private _courses = new Map<number, Course>();
    private _lessons = new Map<number, Lesson>();
    private _quizzes = new Map<number, Quiz>();
    private _progress = new Map<string, Progress>();

    constructor() {
        const hashedPassword = bcrypt.hashSync("password123", 10);
        const student: User = { id: "1", name: "Alex Student", email: "student@asl.org", username: "student", password: hashedPassword, userType: "deaf_student", profilePic: null, preferences: {}, createdAt: new Date() };
        const teacher: User = { id: "2", name: "Sarah Teacher", email: "teacher@asl.org", username: "teacher", password: hashedPassword, userType: "teacher", profilePic: null, preferences: {}, createdAt: new Date() };
        const admin: User = { id: "3", name: "Admin", email: "admin@asl.org", username: "admin", password: hashedPassword, userType: "admin", profilePic: null, preferences: {}, createdAt: new Date() };
        
        this._users.set(student.id, student);
        this._users.set(teacher.id, teacher);
        this._users.set(admin.id, admin);

        const course: Course = { id: 1, title: "Introduction to ASL", description: "Basics of ASL", teacherId: "2", contentList: [], tags: ["asl"], createdAt: new Date() };
        this._courses.set(course.id, course);
    }

    async getUser(id: string) { return this._users.get(id); }
    async getUserByUsername(u: string) { return Array.from(this._users.values()).find(x => x.username === u); }
    async createUser(u: any) { const user = { ...u, id: Math.random().toString() }; this._users.set(user.id, user); return user; }
    async getAllUsers() { return Array.from(this._users.values()); }
    async updateUser(id: string, data: any) { const u = this._users.get(id); if (u) { const n = { ...u, ...data }; this._users.set(id, n); return n; } }
    async getCourses() { return Array.from(this._courses.values()); }
    async getCoursesByTeacher(tId: string) { return Array.from(this._courses.values()).filter(x => x.teacherId === tId); }
    async getCourse(id: number) { return this._courses.get(id); }
    async createCourse(c: any) { const course = { ...c, id: this._courses.size + 1 }; this._courses.set(course.id, course); return course; }
    async updateCourse(id: number, data: any) { const c = this._courses.get(id); if (c) { const n = { ...c, ...data }; this._courses.set(id, n); return n; } }
    async deleteCourse(id: number) { this._courses.delete(id); }
    async getLessons(cId: number) { return Array.from(this._lessons.values()).filter(x => x.courseId === cId); }
    async getLesson(id: number) { return this._lessons.get(id); }
    async createLesson(l: any) { const lesson = { ...l, id: this._lessons.size + 1 }; this._lessons.set(lesson.id, lesson); return lesson; }
    async updateLesson(id: number, data: any) { const l = this._lessons.get(id); if (l) { const n = { ...l, ...data }; this._lessons.set(id, n); return n; } }
    async deleteLesson(id: number) { this._lessons.delete(id); }
    async getEnrollments(uId: string) { return []; }
    async getEnrollmentsByCourse(cId: number) { return []; }
    async getEnrollment(uId: string, cId: number) { return undefined; }
    async createEnrollment(e: any) { return { ...e, id: 1, enrolledAt: new Date() }; }
    async getDoubts(f: any) { return []; }
    async createDoubt(d: any) { return { ...d, id: 1 }; }
    async updateDoubt(id: number, data: any) { return undefined; }
    async createMessage(m: any) { return { ...m, id: 1, timestamp: new Date() }; }
    async getMessages(uId: string, oId: string) { return []; }
    async updateProgress(p: any) { const id = `${p.userId}-${p.courseId}`; this._progress.set(id, p); return p; }
    async getProgress(uId: string, cId: number) { return [this._progress.get(`${uId}-${cId}`) as any].filter(Boolean); }
    async getAllProgress(uId: string) { return Array.from(this._progress.values()).filter(x => x.userId === uId); }
    async getQuizzesByCourse(cId: number) { return []; }
    async getQuizzesByLesson(lId: number) { return []; }
    async getQuiz(id: number) { return undefined; }
    async createQuiz(q: any) { return { ...q, id: 1 }; }
    async submitQuizResult(uId: string, cId: number, lId: number, s: number) {
        return this.updateProgress({ userId: uId, courseId: cId, lessonId: lId, score: s, completed: true });
    }
    async getTranslation(id: string) { return undefined; }
    async createTranslation(t: any) { return { ...t, id: "1" }; }
}

const memStorage = new MemStorage();
const dbStorage = new DatabaseStorage();

export const storage: IStorage = dbStorage;

// Seed in background
dbStorage.seed().catch(() => console.log("⚠️ DB Seed skipped, using Memory Storage defaults"));
