import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Option "mo:core/Option";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─────────────────────────────────────────────────────────────────────────────
  // Custom types for the ERP system
  // ─────────────────────────────────────────────────────────────────────────────

  public type UserRole = {
    #superAdmin;
    #admin;
    #teacher;
    #student;
    #feeManager;
    #principal;
  };

  public type College = {
    id : Text;
    name : Text;
    code : Text;
    address : Text;
    status : Text;
    logoUrl : Text;  // Base64 data URL or empty string
    createdAt : Int;
  };

  public type User = {
    id : Text;
    username : Text;
    email : Text;
    passwordHash : Text;
    role : UserRole;
    collegeId : Text;
    name : Text;
    phone : Text;
    photoUrl : Text;  // Base64 data URL or empty string — profile photo
    createdBy : Text;
    createdAt : Int;
    isActive : Bool;
  };

  public type Session = {
    token : Text;
    userId : Text;
    role : UserRole;
    collegeId : Text;
    expiresAt : Int;
  };

  public type StudentRecord = {
    id : Text;
    collegeId : Text;
    studentId : Text;
    department : Text;
    year : Text;
    course : Text;
    section : Text;
    rollNumber : Text;
    admissionYear : Text;
    fatherName : Text;
    motherName : Text;
    parentPhone : Text;
    address : Text;
    dob : Text;
    gender : Text;
    totalFee : Nat;
    hostelFee : Nat;
    busFee : Nat;
  };

  public type TeacherRecord = {
    id : Text;
    collegeId : Text;
    teacherId : Text;
    department : Text;
    designation : Text;
    qualification : Text;
    joiningDate : Text;
  };

  public type Notice = {
    id : Text;
    collegeId : Text;
    title : Text;
    content : Text;
    createdBy : Text;
    targetRole : Text;
    createdAt : Int;
  };

  public type FeeRecord = {
    id : Text;
    collegeId : Text;
    studentId : Text;
    amount : Nat;
    paidAmount : Nat;
    dueDate : Text;
    status : Text;
  };

  public type UserProfile = {
    userId : Text;
    name : Text;
    email : Text;
    role : UserRole;
    collegeId : Text;
  };

  public type Department = {
    id : Text;
    collegeId : Text;
    name : Text;
    code : Text;
    createdAt : Int;
  };

  public type Course = {
    id : Text;
    collegeId : Text;
    departmentId : Text;
    name : Text;
    code : Text;
    duration : Text;  // e.g. "4 Years", "2 Years"
    createdAt : Int;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Legacy types — used only for stable variable migration on upgrade
  // These match the on-chain shape of data before the logoUrl/photoUrl additions
  // ─────────────────────────────────────────────────────────────────────────────

  type CollegeLegacy = {
    id : Text;
    name : Text;
    code : Text;
    address : Text;
    status : Text;
    createdAt : Int;
  };

  type UserLegacy = {
    id : Text;
    username : Text;
    email : Text;
    passwordHash : Text;
    role : UserRole;
    collegeId : Text;
    name : Text;
    phone : Text;
    createdBy : Text;
    createdAt : Int;
    isActive : Bool;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Stable state — all data persists on-chain via ICP Stable Memory
  // colleges_v2 and users_v2 hold the current schema (with logoUrl / photoUrl).
  // On first upgrade from the old schema the postupgrade hook migrates legacy
  // data from colleges / users into colleges_v2 / users_v2.
  // ─────────────────────────────────────────────────────────────────────────────

  // Legacy stable vars — keep these to read old data on upgrade (DO NOT REMOVE)
  stable var colleges : Map.Map<Text, CollegeLegacy> = Map.empty<Text, CollegeLegacy>();
  stable var users : Map.Map<Text, UserLegacy> = Map.empty<Text, UserLegacy>();

  // Current stable vars with new fields
  stable var colleges_v2 = Map.empty<Text, College>();
  stable var users_v2 = Map.empty<Text, User>();

  stable var sessions = Map.empty<Text, Session>();
  stable var studentRecords = Map.empty<Text, StudentRecord>();
  stable var teacherRecords = Map.empty<Text, TeacherRecord>();
  stable var notices = Map.empty<Text, Notice>();
  stable var feeRecords = Map.empty<Text, FeeRecord>();
  stable var departments = Map.empty<Text, Department>();  // Per-college departments
  stable var courses = Map.empty<Text, Course>();           // Per-college courses
  stable var userProfiles = Map.empty<Principal, UserProfile>();

  // Tracks one active session per user for single-session roles
  // (student, teacher, feeManager, principal)
  // SuperAdmin and Admin are NOT tracked here — they support multi-device login
  stable var activeSessionMap = Map.empty<Text, Text>(); // userId -> token

  stable var nextId : Nat = 0;
  stable var bootstrapped : Bool = false;

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────────────────────

  func generateId() : Text {
    nextId += 1;
    "id_" # nextId.toText();
  };

  func getCurrentTime() : Int {
    Time.now();
  };

  func validateSession(token : Text) : ?Session {
    switch (sessions.get(token)) {
      case null { null };
      case (?session) {
        if (session.expiresAt > getCurrentTime()) {
          ?session;
        } else {
          sessions.remove(token);
          null;
        };
      };
    };
  };

  func requireSession(token : Text) : Session {
    switch (validateSession(token)) {
      case null { Runtime.trap("Unauthorized: Invalid or expired session") };
      case (?session) { session };
    };
  };

  func requireSuperAdmin(session : Session) {
    switch (session.role) {
      case (#superAdmin) {};
      case _ { Runtime.trap("Unauthorized: SuperAdmin access required") };
    };
  };

  func requireAdminOrSuperAdmin(session : Session) {
    switch (session.role) {
      case (#superAdmin) {};
      case (#admin) {};
      case _ { Runtime.trap("Unauthorized: Admin or SuperAdmin access required") };
    };
  };

  func requireCollegeAccess(session : Session, collegeId : Text) {
    switch (session.role) {
      case (#superAdmin) {};
      case _ {
        if (session.collegeId != collegeId) {
          Runtime.trap("Unauthorized: Cannot access data from different college");
        };
      };
    };
  };

  // Returns true if this role enforces single-device login
  func isSingleSessionRole(role : UserRole) : Bool {
    switch (role) {
      case (#student) { true };
      case (#teacher) { true };
      case (#feeManager) { true };
      case (#principal) { true };
      case _ { false }; // superAdmin and admin: multi-device allowed
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Bootstrap SuperAdmin — runs once on first deployment
  // Stored in stable memory so it persists across upgrades and restarts
  // ─────────────────────────────────────────────────────────────────────────────

  func bootstrap() {
    if (not bootstrapped) {
      let superAdminId = generateId();
      let superAdmin : User = {
        id = superAdminId;
        username = "vikassirvi77288";
        email = "vikassirvi001@gmail.com";
        passwordHash = "vikas@sirvi_77288";
        role = #superAdmin;
        collegeId = "";
        name = "Super Admin";
        phone = "";
        photoUrl = "";  // No photo initially
        createdBy = superAdminId;
        createdAt = getCurrentTime();
        isActive = true;
      };
      users_v2.add(superAdminId, superAdmin);
      bootstrapped := true;
    };
  };

  bootstrap();

  // ─────────────────────────────────────────────────────────────────────────────
  // User Profile functions (required by authorization mixin)
  // ─────────────────────────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Authentication
  // ─────────────────────────────────────────────────────────────────────────────

  public func login(username : Text, password : Text) : async {
    token : Text;
    userId : Text;
    role : UserRole;
    collegeId : Text;
    name : Text;
    photoUrl : Text;
  } {
    var foundUser : ?User = null;
    for ((_, user) in users_v2.entries()) {
      if ((user.username == username or user.email == username) and user.passwordHash == password and user.isActive) {
        foundUser := ?user;
      };
    };

    switch (foundUser) {
      case null { Runtime.trap("Invalid credentials") };
      case (?user) {
        // Enforce single-device session for student/teacher/feeManager/principal
        if (isSingleSessionRole(user.role)) {
          switch (activeSessionMap.get(user.id)) {
            case (?existingToken) {
              switch (validateSession(existingToken)) {
                case (?_) {
                  Runtime.trap("already_logged_in");
                };
                case null {
                  activeSessionMap.remove(user.id);
                };
              };
            };
            case null {};
          };
        };

        // Create new session (24-hour expiry)
        let token = generateId() # "_token";
        let session : Session = {
          token = token;
          userId = user.id;
          role = user.role;
          collegeId = user.collegeId;
          expiresAt = getCurrentTime() + 86400_000_000_000;
        };
        sessions.add(token, session);

        // Track active session for single-session roles
        if (isSingleSessionRole(user.role)) {
          activeSessionMap.add(user.id, token);
        };

        {
          token = token;
          userId = user.id;
          role = user.role;
          collegeId = user.collegeId;
          name = user.name;
          photoUrl = user.photoUrl;
        };
      };
    };
  };

  public func logout(token : Text) : async () {
    switch (sessions.get(token)) {
      case (?session) {
        if (isSingleSessionRole(session.role)) {
          switch (activeSessionMap.get(session.userId)) {
            case (?activeToken) {
              if (activeToken == token) {
                activeSessionMap.remove(session.userId);
              };
            };
            case null {};
          };
        };
        sessions.remove(token);
      };
      case null {};
    };
  };

  public query func getSession(token : Text) : async ?Session {
    validateSession(token);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // College Management
  // ─────────────────────────────────────────────────────────────────────────────

  public func createCollege(token : Text, name : Text, code : Text, address : Text) : async College {
    let session = requireSession(token);
    requireSuperAdmin(session);

    let collegeId = generateId();
    let college : College = {
      id = collegeId;
      name = name;
      code = code;
      address = address;
      status = "active";
      logoUrl = "";  // No logo by default
      createdAt = getCurrentTime();
    };
    colleges_v2.add(collegeId, college);
    college;
  };

  public query func listColleges(token : Text) : async [College] {
    let session = requireSession(token);

    switch (session.role) {
      case (#superAdmin) {
        colleges_v2.entries().map(func((_, c) : (Text, College)) : College { c }).toArray();
      };
      case (#admin) {
        switch (colleges_v2.get(session.collegeId)) {
          case null { [] };
          case (?college) { [college] };
        };
      };
      case _ {
        Runtime.trap("Unauthorized: Only SuperAdmin or Admin can list colleges");
      };
    };
  };

  public query func getCollege(token : Text, collegeId : Text) : async College {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    switch (colleges_v2.get(collegeId)) {
      case null { Runtime.trap("College not found") };
      case (?college) { college };
    };
  };

  public func updateCollege(token : Text, collegeId : Text, name : Text, address : Text, status : Text) : async College {
    let session = requireSession(token);
    requireSuperAdmin(session);

    switch (colleges_v2.get(collegeId)) {
      case null { Runtime.trap("College not found") };
      case (?college) {
        let updated : College = {
          id = college.id;
          name = name;
          code = college.code;
          address = address;
          status = status;
          logoUrl = college.logoUrl;  // Preserve existing logo
          createdAt = college.createdAt;
        };
        colleges_v2.add(collegeId, updated);
        updated;
      };
    };
  };

  // Upload or update logo for a college (base64 data URL)
  public func uploadCollegeLogo(token : Text, collegeId : Text, logoDataUrl : Text) : async College {
    let session = requireSession(token);
    requireSuperAdmin(session);

    switch (colleges_v2.get(collegeId)) {
      case null { Runtime.trap("College not found") };
      case (?college) {
        let updated : College = {
          id = college.id;
          name = college.name;
          code = college.code;
          address = college.address;
          status = college.status;
          logoUrl = logoDataUrl;
          createdAt = college.createdAt;
        };
        colleges_v2.add(collegeId, updated);
        updated;
      };
    };
  };

  public func deleteCollege(token : Text, collegeId : Text) : async () {
    let session = requireSession(token);
    requireSuperAdmin(session);
    colleges_v2.remove(collegeId);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // User Management
  // ─────────────────────────────────────────────────────────────────────────────

  public func createUser(
    token : Text,
    username : Text,
    email : Text,
    password : Text,
    role : UserRole,
    collegeId : Text,
    name : Text,
    phone : Text,
  ) : async User {
    let session = requireSession(token);

    switch (session.role) {
      case (#superAdmin) {
        switch (role) {
          case (#admin) {};
          case _ { Runtime.trap("SuperAdmin can only create Admin users") };
        };
      };
      case (#admin) {
        if (collegeId != session.collegeId) {
          Runtime.trap("Unauthorized: Cannot create users for different college");
        };
        switch (role) {
          case (#superAdmin) { Runtime.trap("Cannot create SuperAdmin") };
          case (#admin) { Runtime.trap("Cannot create Admin users") };
          case _ {};
        };
      };
      case _ {
        Runtime.trap("Unauthorized: Only SuperAdmin or Admin can create users");
      };
    };

    let userId = generateId();
    let user : User = {
      id = userId;
      username = username;
      email = email;
      passwordHash = password;
      role = role;
      collegeId = collegeId;
      name = name;
      phone = phone;
      photoUrl = "";  // No photo initially
      createdBy = session.userId;
      createdAt = getCurrentTime();
      isActive = true;
    };
    users_v2.add(userId, user);
    user;
  };

  public query func listUsers(token : Text, collegeId : Text, roleFilter : Text) : async [User] {
    let session = requireSession(token);

    switch (session.role) {
      case (#superAdmin) {};
      case _ {
        if (collegeId != "" and session.collegeId != collegeId) {
          Runtime.trap("Unauthorized: Cannot list users from different college");
        };
      };
    };

    let filtered = users_v2.entries().filter(func((_, user) : (Text, User)) : Bool {
      let collegeMatch = (collegeId == "" and session.role == #superAdmin) or user.collegeId == collegeId;
      let roleMatch = roleFilter == "" or roleToText(user.role) == roleFilter;
      collegeMatch and roleMatch
    });
    filtered.map(func((_, u) : (Text, User)) : User { u }).toArray();
  };

  public query func getUser(token : Text, userId : Text) : async User {
    let session = requireSession(token);

    switch (users_v2.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        user;
      };
    };
  };

  public func updateUser(token : Text, userId : Text, name : Text, email : Text, phone : Text, isActive : Bool) : async User {
    let session = requireSession(token);

    switch (users_v2.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        requireAdminOrSuperAdmin(session);

        let updated : User = {
          id = user.id;
          username = user.username;
          email = email;
          passwordHash = user.passwordHash;
          role = user.role;
          collegeId = user.collegeId;
          name = name;
          phone = phone;
          photoUrl = user.photoUrl;  // Preserve existing photo
          createdBy = user.createdBy;
          createdAt = user.createdAt;
          isActive = isActive;
        };
        users_v2.add(userId, updated);
        updated;
      };
    };
  };

  // Upload or update profile photo for a user (base64 data URL)
  // SuperAdmin can upload for any user; Admin can upload for users in their college
  public func uploadUserPhoto(token : Text, userId : Text, photoDataUrl : Text) : async User {
    let session = requireSession(token);
    requireAdminOrSuperAdmin(session);

    switch (users_v2.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        let updated : User = {
          id = user.id;
          username = user.username;
          email = user.email;
          passwordHash = user.passwordHash;
          role = user.role;
          collegeId = user.collegeId;
          name = user.name;
          phone = user.phone;
          photoUrl = photoDataUrl;
          createdBy = user.createdBy;
          createdAt = user.createdAt;
          isActive = user.isActive;
        };
        users_v2.add(userId, updated);
        updated;
      };
    };
  };

  public func resetPassword(token : Text, userId : Text, newPassword : Text) : async () {
    let session = requireSession(token);

    switch (users_v2.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        requireAdminOrSuperAdmin(session);

        let updated : User = {
          id = user.id;
          username = user.username;
          email = user.email;
          passwordHash = newPassword;
          role = user.role;
          collegeId = user.collegeId;
          name = user.name;
          phone = user.phone;
          photoUrl = user.photoUrl;  // Preserve existing photo
          createdBy = user.createdBy;
          createdAt = user.createdAt;
          isActive = user.isActive;
        };
        users_v2.add(userId, updated);
      };
    };
  };

  public func deleteUser(token : Text, userId : Text) : async () {
    let session = requireSession(token);

    switch (users_v2.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        requireAdminOrSuperAdmin(session);
        activeSessionMap.remove(userId);
        users_v2.remove(userId);
      };
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Student Records
  // ─────────────────────────────────────────────────────────────────────────────

  public func addStudentRecord(
    token : Text,
    collegeId : Text,
    studentId : Text,
    department : Text,
    year : Text,
    course : Text,
    section : Text,
    rollNumber : Text,
    admissionYear : Text,
    fatherName : Text,
    motherName : Text,
    parentPhone : Text,
    address : Text,
    dob : Text,
    gender : Text,
    totalFee : Nat,
    hostelFee : Nat,
    busFee : Nat,
  ) : async StudentRecord {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);
    requireAdminOrSuperAdmin(session);

    let recordId = generateId();
    let record : StudentRecord = {
      id = recordId;
      collegeId = collegeId;
      studentId = studentId;
      department = department;
      year = year;
      course = course;
      section = section;
      rollNumber = rollNumber;
      admissionYear = admissionYear;
      fatherName = fatherName;
      motherName = motherName;
      parentPhone = parentPhone;
      address = address;
      dob = dob;
      gender = gender;
      totalFee = totalFee;
      hostelFee = hostelFee;
      busFee = busFee;
    };
    studentRecords.add(recordId, record);
    record;
  };

  public query func listStudentRecords(token : Text, collegeId : Text) : async [StudentRecord] {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    let filtered = studentRecords.entries().filter(func((_, r) : (Text, StudentRecord)) : Bool {
      r.collegeId == collegeId;
    });
    filtered.map(func((_, r) : (Text, StudentRecord)) : StudentRecord { r }).toArray();
  };

  public query func getStudentRecord(token : Text, studentId : Text) : async StudentRecord {
    let session = requireSession(token);

    switch (studentRecords.get(studentId)) {
      case null { Runtime.trap("Student record not found") };
      case (?record) {
        requireCollegeAccess(session, record.collegeId);
        record;
      };
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Teacher Records
  // ─────────────────────────────────────────────────────────────────────────────

  public func addTeacherRecord(
    token : Text,
    collegeId : Text,
    teacherId : Text,
    department : Text,
    designation : Text,
    qualification : Text,
    joiningDate : Text,
  ) : async TeacherRecord {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);
    requireAdminOrSuperAdmin(session);

    let recordId = generateId();
    let record : TeacherRecord = {
      id = recordId;
      collegeId = collegeId;
      teacherId = teacherId;
      department = department;
      designation = designation;
      qualification = qualification;
      joiningDate = joiningDate;
    };
    teacherRecords.add(recordId, record);
    record;
  };

  public query func listTeacherRecords(token : Text, collegeId : Text) : async [TeacherRecord] {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    let filtered = teacherRecords.entries().filter(func((_, r) : (Text, TeacherRecord)) : Bool {
      r.collegeId == collegeId;
    });
    filtered.map(func((_, r) : (Text, TeacherRecord)) : TeacherRecord { r }).toArray();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Notice Board
  // ─────────────────────────────────────────────────────────────────────────────

  public func createNotice(
    token : Text,
    collegeId : Text,
    title : Text,
    content : Text,
    targetRole : Text,
  ) : async Notice {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);
    requireAdminOrSuperAdmin(session);

    let noticeId = generateId();
    let notice : Notice = {
      id = noticeId;
      collegeId = collegeId;
      title = title;
      content = content;
      createdBy = session.userId;
      targetRole = targetRole;
      createdAt = getCurrentTime();
    };
    notices.add(noticeId, notice);
    notice;
  };

  public query func listNotices(token : Text, collegeId : Text) : async [Notice] {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    let filtered = notices.entries().filter(func((_, n) : (Text, Notice)) : Bool {
      n.collegeId == collegeId;
    });
    filtered.map(func((_, n) : (Text, Notice)) : Notice { n }).toArray();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Fee Records
  // ─────────────────────────────────────────────────────────────────────────────

  public func addFeeRecord(
    token : Text,
    collegeId : Text,
    studentId : Text,
    amount : Nat,
    paidAmount : Nat,
    dueDate : Text,
    status : Text,
  ) : async FeeRecord {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    switch (session.role) {
      case (#superAdmin) {};
      case (#admin) {};
      case (#feeManager) {};
      case _ { Runtime.trap("Unauthorized: Only Admin or FeeManager can add fee records") };
    };

    let recordId = generateId();
    let record : FeeRecord = {
      id = recordId;
      collegeId = collegeId;
      studentId = studentId;
      amount = amount;
      paidAmount = paidAmount;
      dueDate = dueDate;
      status = status;
    };
    feeRecords.add(recordId, record);
    record;
  };

  public query func listFeeRecords(token : Text, collegeId : Text) : async [FeeRecord] {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    let filtered = feeRecords.entries().filter(func((_, r) : (Text, FeeRecord)) : Bool {
      r.collegeId == collegeId;
    });
    filtered.map(func((_, r) : (Text, FeeRecord)) : FeeRecord { r }).toArray();
  };

  public func updateFeeRecord(token : Text, feeRecordId : Text, paidAmount : Nat, status : Text) : async FeeRecord {
    let session = requireSession(token);

    switch (feeRecords.get(feeRecordId)) {
      case null { Runtime.trap("Fee record not found") };
      case (?record) {
        requireCollegeAccess(session, record.collegeId);

        switch (session.role) {
          case (#superAdmin) {};
          case (#admin) {};
          case (#feeManager) {};
          case _ { Runtime.trap("Unauthorized: Only Admin or FeeManager can update fee records") };
        };

        let updated : FeeRecord = {
          id = record.id;
          collegeId = record.collegeId;
          studentId = record.studentId;
          amount = record.amount;
          paidAmount = paidAmount;
          dueDate = record.dueDate;
          status = status;
        };
        feeRecords.add(feeRecordId, updated);
        updated;
      };
    };
  };


  // ─────────────────────────────────────────────────────────────────────────────
  // Department Management
  // ─────────────────────────────────────────────────────────────────────────────

  public func createDepartment(token : Text, collegeId : Text, name : Text, code : Text) : async Department {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);
    requireAdminOrSuperAdmin(session);

    let deptId = generateId();
    let dept : Department = {
      id = deptId;
      collegeId = collegeId;
      name = name;
      code = code;
      createdAt = getCurrentTime();
    };
    departments.add(deptId, dept);
    dept;
  };

  public query func listDepartments(token : Text, collegeId : Text) : async [Department] {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    let filtered = departments.entries().filter(func((_, d) : (Text, Department)) : Bool {
      d.collegeId == collegeId;
    });
    filtered.map(func((_, d) : (Text, Department)) : Department { d }).toArray();
  };

  public func updateDepartment(token : Text, deptId : Text, name : Text, code : Text) : async Department {
    let session = requireSession(token);
    requireAdminOrSuperAdmin(session);

    switch (departments.get(deptId)) {
      case null { Runtime.trap("Department not found") };
      case (?dept) {
        requireCollegeAccess(session, dept.collegeId);
        let updated : Department = {
          id = dept.id;
          collegeId = dept.collegeId;
          name = name;
          code = code;
          createdAt = dept.createdAt;
        };
        departments.add(deptId, updated);
        updated;
      };
    };
  };

  public func deleteDepartment(token : Text, deptId : Text) : async () {
    let session = requireSession(token);
    requireAdminOrSuperAdmin(session);

    switch (departments.get(deptId)) {
      case null { Runtime.trap("Department not found") };
      case (?dept) {
        requireCollegeAccess(session, dept.collegeId);
        departments.remove(deptId);
      };
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Course Management
  // ─────────────────────────────────────────────────────────────────────────────

  public func createCourse(token : Text, collegeId : Text, departmentId : Text, name : Text, code : Text, duration : Text) : async Course {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);
    requireAdminOrSuperAdmin(session);

    let courseId = generateId();
    let course : Course = {
      id = courseId;
      collegeId = collegeId;
      departmentId = departmentId;
      name = name;
      code = code;
      duration = duration;
      createdAt = getCurrentTime();
    };
    courses.add(courseId, course);
    course;
  };

  public query func listCourses(token : Text, collegeId : Text) : async [Course] {
    let session = requireSession(token);
    requireCollegeAccess(session, collegeId);

    let filtered = courses.entries().filter(func((_, c) : (Text, Course)) : Bool {
      c.collegeId == collegeId;
    });
    filtered.map(func((_, c) : (Text, Course)) : Course { c }).toArray();
  };

  public func updateCourse(token : Text, courseId : Text, name : Text, code : Text, duration : Text) : async Course {
    let session = requireSession(token);
    requireAdminOrSuperAdmin(session);

    switch (courses.get(courseId)) {
      case null { Runtime.trap("Course not found") };
      case (?course) {
        requireCollegeAccess(session, course.collegeId);
        let updated : Course = {
          id = course.id;
          collegeId = course.collegeId;
          departmentId = course.departmentId;
          name = name;
          code = code;
          duration = duration;
          createdAt = course.createdAt;
        };
        courses.add(courseId, updated);
        updated;
      };
    };
  };

  public func deleteCourse(token : Text, courseId : Text) : async () {
    let session = requireSession(token);
    requireAdminOrSuperAdmin(session);

    switch (courses.get(courseId)) {
      case null { Runtime.trap("Course not found") };
      case (?course) {
        requireCollegeAccess(session, course.collegeId);
        courses.remove(courseId);
      };
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration — runs after every upgrade
  // Copies legacy colleges/users (old schema) into colleges_v2/users_v2 if they
  // haven't been migrated yet (i.e. colleges_v2 is empty but colleges has data).
  // ─────────────────────────────────────────────────────────────────────────────

  system func postupgrade() {
    // Migrate colleges: add logoUrl = "" for any entry not yet in colleges_v2
    for ((id, c) in colleges.entries()) {
      switch (colleges_v2.get(id)) {
        case null {
          let migrated : College = {
            id = c.id;
            name = c.name;
            code = c.code;
            address = c.address;
            status = c.status;
            logoUrl = "";
            createdAt = c.createdAt;
          };
          colleges_v2.add(id, migrated);
        };
        case (?_) {}; // already migrated
      };
    };

    // Migrate users: add photoUrl = "" for any entry not yet in users_v2
    for ((id, u) in users.entries()) {
      switch (users_v2.get(id)) {
        case null {
          let migrated : User = {
            id = u.id;
            username = u.username;
            email = u.email;
            passwordHash = u.passwordHash;
            role = u.role;
            collegeId = u.collegeId;
            name = u.name;
            phone = u.phone;
            photoUrl = "";
            createdBy = u.createdBy;
            createdAt = u.createdAt;
            isActive = u.isActive;
          };
          users_v2.add(id, migrated);
        };
        case (?_) {}; // already migrated
      };
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────────

  func roleToText(role : UserRole) : Text {
    switch (role) {
      case (#superAdmin) { "superAdmin" };
      case (#admin) { "admin" };
      case (#teacher) { "teacher" };
      case (#student) { "student" };
      case (#feeManager) { "feeManager" };
      case (#principal) { "principal" };
    };
  };
};
