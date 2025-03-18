// User role enum
export enum UserRole {
  Member = "Member",
  Sponsor = "Sponsor",
  Admin = "Admin",
}

// Application status enum
export enum ApplicationStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

// Report type enum
export enum ReportedType {
  Message = "Message",
  GroupChatMessage = "GroupChatMessage",
  GroupChat = "GroupChat",
  User = "User",
  Post = "Post",
  Comment = "Comment",
}

// Report status enum
export enum ReportStatus {
  Pending = "Pending",
  Resolved = "Resolved",
  Reviewed = "Reviewed",
}

// Meeting status enum
export enum MeetingStatus {
  Upcoming = "Upcoming",
  Ongoing = "Ongoing",
  Ended = "Ended",
}

// Support group status enum
export enum SupportGroupStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

// Matching status enum
export enum MatchingStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Declined = "Declined",
}
