export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'freelancer' | 'client';
  profile?: UserProfile;
  badges: Badge[];
  createdAt: string;
}

export interface UserProfile {
  bio: string;
  title: string;
  hourlyRate: number;
  skills: string[];
  portfolio: PortfolioItem[];
  location: string;
  languages: string[];
  education: string;
  experience: string;
  avatar?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies: string[];
  completedAt: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: 'fixed' | 'hourly';
  duration: string;
  skillsRequired: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  deadline?: string;
  bids: Bid[];
  selectedFreelancerId?: string;
  invitedFreelancers: string[]; // Track invited freelancers
  submission?: ProjectSubmission;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  jobId?: string;
  content: string;
  createdAt: string;
  read: boolean;
  messageType: 'text' | 'file';
  fileName?: string;
  fileData?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  jobId?: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSubmission {
  id: string;
  jobId: string;
  freelancerId: string;
  fileName: string;
  fileData: string; // Base64 encoded file data
  fileSize: number;
  submittedAt: string;
  status: 'submitted' | 'approved' | 'rejected';
  clientFeedback?: string;
}

export interface Bid {
  id: string;
  jobId: string;
  freelancerId: string;
  amount: number;
  proposal: string;
  estimatedDuration: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  jobId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'profile' | 'bidding' | 'jobs' | 'reviews' | 'engagement';
}

export interface Payment {
  id: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  status: 'pending' | 'escrow' | 'released' | 'refunded';
  createdAt: string;
  releasedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'bid_received' | 'bid_accepted' | 'bid_rejected' | 'job_completed' | 'message_received' | 'badge_earned' | 'first_job_posted' | 'job_invitation' | 'invitation_sent' | 'payment_received';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AppState {
  users: User[];
  jobs: Job[];
  bids: Bid[];
  reviews: Review[];
  chats: Chat[];
  payments: Payment[];
  notifications: Notification[];
}
