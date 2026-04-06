import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Session {
    token: string;
    expiresAt: bigint;
    userId: string;
    role: UserRole;
    collegeId: string;
}
export interface FeeRecord {
    id: string;
    status: string;
    studentId: string;
    dueDate: string;
    collegeId: string;
    paidAmount: bigint;
    amount: bigint;
}
export interface User {
    id: string;
    username: string;
    name: string;
    createdAt: bigint;
    createdBy: string;
    role: UserRole;
    isActive: boolean;
    email: string;
    collegeId: string;
    passwordHash: string;
    phone: string;
}
export interface College {
    id: string;
    status: string;
    code: string;
    name: string;
    createdAt: bigint;
    address: string;
}
export interface Notice {
    id: string;
    title: string;
    content: string;
    createdAt: bigint;
    createdBy: string;
    collegeId: string;
    targetRole: string;
}
export interface StudentRecord {
    id: string;
    dob: string;
    studentId: string;
    admissionYear: string;
    year: string;
    parentPhone: string;
    section: string;
    motherName: string;
    totalFee: bigint;
    collegeId: string;
    fatherName: string;
    rollNumber: string;
    address: string;
    gender: string;
    department: string;
    course: string;
    busFee: bigint;
    hostelFee: bigint;
}
export interface TeacherRecord {
    id: string;
    designation: string;
    joiningDate: string;
    collegeId: string;
    teacherId: string;
    department: string;
    qualification: string;
}
export interface UserProfile {
    userId: string;
    name: string;
    role: UserRole;
    email: string;
    collegeId: string;
}
export enum UserRole {
    principal = "principal",
    admin = "admin",
    feeManager = "feeManager",
    teacher = "teacher",
    superAdmin = "superAdmin",
    student = "student"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFeeRecord(token: string, collegeId: string, studentId: string, amount: bigint, paidAmount: bigint, dueDate: string, status: string): Promise<FeeRecord>;
    addStudentRecord(token: string, collegeId: string, studentId: string, department: string, year: string, course: string, section: string, rollNumber: string, admissionYear: string, fatherName: string, motherName: string, parentPhone: string, address: string, dob: string, gender: string, totalFee: bigint, hostelFee: bigint, busFee: bigint): Promise<StudentRecord>;
    addTeacherRecord(token: string, collegeId: string, teacherId: string, department: string, designation: string, qualification: string, joiningDate: string): Promise<TeacherRecord>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createCollege(token: string, name: string, code: string, address: string): Promise<College>;
    createNotice(token: string, collegeId: string, title: string, content: string, targetRole: string): Promise<Notice>;
    createUser(token: string, username: string, email: string, password: string, role: UserRole, collegeId: string, name: string, phone: string): Promise<User>;
    deleteUser(token: string, userId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getCollege(token: string, collegeId: string): Promise<College>;
    getSession(token: string): Promise<Session | null>;
    getStudentRecord(token: string, studentId: string): Promise<StudentRecord>;
    getUser(token: string, userId: string): Promise<User>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listColleges(token: string): Promise<Array<College>>;
    listFeeRecords(token: string, collegeId: string): Promise<Array<FeeRecord>>;
    listNotices(token: string, collegeId: string): Promise<Array<Notice>>;
    listStudentRecords(token: string, collegeId: string): Promise<Array<StudentRecord>>;
    listTeacherRecords(token: string, collegeId: string): Promise<Array<TeacherRecord>>;
    listUsers(token: string, collegeId: string, roleFilter: string): Promise<Array<User>>;
    login(username: string, password: string): Promise<{
        token: string;
        userId: string;
        name: string;
        role: UserRole;
        collegeId: string;
    }>;
    logout(token: string): Promise<void>;
    resetPassword(token: string, userId: string, newPassword: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCollege(token: string, collegeId: string, name: string, address: string, status: string): Promise<College>;
    updateFeeRecord(token: string, feeRecordId: string, paidAmount: bigint, status: string): Promise<FeeRecord>;
    updateUser(token: string, userId: string, name: string, email: string, phone: string, isActive: boolean): Promise<User>;
}
