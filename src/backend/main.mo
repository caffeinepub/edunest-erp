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

  // Custom types for the ERP system
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

  // State storage
  stable var colleges = Map.empty<Text, College>();
  stable var users = Map.empty<Text, User>();
  stable var sessions = Map.empty<Text, Session>();
  stable var studentRecords = Map.empty<Text, StudentRecord>();
  stable var teacherRecords = Map.empty<Text, TeacherRecord>();
  stable var notices = Map.empty<Text, Notice>();
  stable var feeRecords = Map.empty<Text, FeeRecord>();
  stable var userProfiles = Map.empty<Principal, UserProfile>();

  stable var nextId : Nat = 0;
  stable var bootstrapped : Bool = false;

  // Helper functions
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

  func requireSameCollege(session : Session, collegeId : Text) {
    switch (session.role) {
      case (#superAdmin) {}; // SuperAdmin can access all colleges
      case _ {
        if (session.collegeId != collegeId) {
          Runtime.trap("Unauthorized: Access denied to different college data");
        };
      };
    };
  };

  func requireCollegeAccess(session : Session, collegeId : Text) {
    switch (session.role) {
      case (#superAdmin) {}; // SuperAdmin can access all
      case _ {
        if (session.collegeId != collegeId) {
          Runtime.trap("Unauthorized: Cannot access data from different college");
        };
      };
    };
  };

  // Bootstrap SuperAdmin
  func bootstrap() {
    if (not bootstrapped) {
      let superAdminId = generateId();
      let superAdmin : User = {
        id = superAdminId;
        username = "vikassirvi77288";
        email = "vikassirvi001@gmail.com";
        passwordHash = "vikas@sirvi_77288"; // Plain password for demo
        role = #superAdmin;
        collegeId = "";
        name = "Super Admin";
        phone = "";
        createdBy = superAdminId;
        createdAt = getCurrentTime();
        isActive = true;
      };
      users.add(superAdminId, superAdmin);
      bootstrapped := true;
    };
  };

  // Initialize on first call
  bootstrap();

  // User Profile functions (required by frontend)
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

  // Authentication
  public func login(username : Text, password : Text) : async {
    token : Text;
    userId : Text;
    role : UserRole;
    collegeId : Text;
    name : Text;
  } {
    var foundUser : ?User = null;
    for ((_, user) in users.entries()) {
      // Match by username OR email (admins log in with email)
      if ((user.username == username or user.email == username) and user.passwordHash == password and user.isActive) {
        foundUser := ?user;
      };
    };

    switch (foundUser) {
      case null { Runtime.trap("Invalid credentials") };
      case (?user) {
        let token = generateId() # "_token";
        let session : Session = {
          token = token;
          userId = user.id;
          role = user.role;
          collegeId = user.collegeId;
          expiresAt = getCurrentTime() + 86400_000_000_000; // 24 hours
        };
        sessions.add(token, session);
        {
          token = token;
          userId = user.id;
          role = user.role;
          collegeId = user.collegeId;
          name = user.name;
        };
      };
    };
  };

  public func logout(token : Text) : async () {
    sessions.remove(token);
  };

  public query func getSession(token : Text) : async ?Session {
    validateSession(token);
  };

  // College Management
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
      createdAt = getCurrentTime();
    };
    colleges.add(collegeId, college);
    college;
  };

  public query func listColleges(token : Text) : async [College] {
    let session = requireSession(token);

    switch (session.role) {
      case (#superAdmin) {
        // SuperAdmin sees all colleges
        colleges.entries().map(func((_, c) : (Text, College)) : College { c }).toArray();
      };
      case (#admin) {
        // Admin sees only their college
        switch (colleges.get(session.collegeId)) {
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

    switch (colleges.get(collegeId)) {
      case null { Runtime.trap("College not found") };
      case (?college) { college };
    };
  };

  public func updateCollege(token : Text, collegeId : Text, name : Text, address : Text, status : Text) : async College {
    let session = requireSession(token);
    requireSuperAdmin(session);

    switch (colleges.get(collegeId)) {
      case null { Runtime.trap("College not found") };
      case (?college) {
        let updated : College = {
          id = college.id;
          name = name;
          code = college.code;
          address = address;
          status = status;
          createdAt = college.createdAt;
        };
        colleges.add(collegeId, updated);
        updated;
      };
    };
  };


  public func deleteCollege(token : Text, collegeId : Text) : async () {
    let session = requireSession(token);
    requireSuperAdmin(session);
    colleges.remove(collegeId);
  };

  // User Management
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

    // Authorization checks
    switch (session.role) {
      case (#superAdmin) {
        // SuperAdmin can create Admin users for any college
        switch (role) {
          case (#admin) {};
          case _ { Runtime.trap("SuperAdmin can only create Admin users") };
        };
      };
      case (#admin) {
        // Admin can create users only for their own college
        if (collegeId != session.collegeId) {
          Runtime.trap("Unauthorized: Cannot create users for different college");
        };
        // Admin cannot create SuperAdmin or Admin
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
      createdBy = session.userId;
      createdAt = getCurrentTime();
      isActive = true;
    };
    users.add(userId, user);
    user;
  };

  public query func listUsers(token : Text, collegeId : Text, roleFilter : Text) : async [User] {
    let session = requireSession(token);

    // SuperAdmin can list across all colleges (pass empty collegeId)
    // Others must pass their own collegeId
    switch (session.role) {
      case (#superAdmin) {};
      case _ {
        if (collegeId != "" and session.collegeId != collegeId) {
          Runtime.trap("Unauthorized: Cannot list users from different college");
        };
      };
    };

    let filtered = users.entries().filter(func((_, user) : (Text, User)) : Bool {
      // If collegeId is empty and caller is SuperAdmin, return all matching role
      let collegeMatch = (collegeId == "" and session.role == #superAdmin) or user.collegeId == collegeId;
      let roleMatch = roleFilter == "" or roleToText(user.role) == roleFilter;
      collegeMatch and roleMatch
    });
    filtered.map(func((_, u) : (Text, User)) : User { u }).toArray();
  };

  public query func getUser(token : Text, userId : Text) : async User {
    let session = requireSession(token);

    switch (users.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        user;
      };
    };
  };

  public func updateUser(token : Text, userId : Text, name : Text, email : Text, phone : Text, isActive : Bool) : async User {
    let session = requireSession(token);

    switch (users.get(userId)) {
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
          createdBy = user.createdBy;
          createdAt = user.createdAt;
          isActive = isActive;
        };
        users.add(userId, updated);
        updated;
      };
    };
  };

  public func resetPassword(token : Text, userId : Text, newPassword : Text) : async () {
    let session = requireSession(token);

    switch (users.get(userId)) {
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
          createdBy = user.createdBy;
          createdAt = user.createdAt;
          isActive = user.isActive;
        };
        users.add(userId, updated);
      };
    };
  };

  public func deleteUser(token : Text, userId : Text) : async () {
    let session = requireSession(token);

    switch (users.get(userId)) {
      case null { Runtime.trap("User not found") };
      case (?user) {
        requireCollegeAccess(session, user.collegeId);
        requireAdminOrSuperAdmin(session);
        users.remove(userId);
      };
    };
  };

  // Student Records
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

  // Teacher Records
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

  // Notice Board
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

  // Fee Records
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

    // Only Admin or FeeManager can add fee records
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

        // Only Admin or FeeManager can update fee records
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

  // Helper function to convert role to text
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
