import { User, Job, Bid, Payment, Notification, Message, Conversation, Review, Badge, Chat } from '../types';

const STORAGE_KEYS = {
  USERS: 'freelance_marketplace_users',
  JOBS: 'freelance_marketplace_jobs',
  BIDS: 'freelance_marketplace_bids',
  REVIEWS: 'freelance_marketplace_reviews',
  CHATS: 'freelance_marketplace_chats',
  PAYMENTS: 'freelance_marketplace_payments',
  NOTIFICATIONS: 'freelance_marketplace_notifications',
  BADGES: 'freelance_marketplace_badges',
  CURRENT_USER: 'freelance_marketplace_current_user',
} as const;

export class StorageService {
  static getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getJobs(): Job[] {
    const data = localStorage.getItem(STORAGE_KEYS.JOBS);
    return data ? JSON.parse(data) : [];
  }

  static saveJobs(jobs: Job[]): void {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  }

  static getBids(): Bid[] {
    const data = localStorage.getItem(STORAGE_KEYS.BIDS);
    return data ? JSON.parse(data) : [];
  }

  static saveBids(bids: Bid[]): void {
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
  }

  static getReviews(): Review[] {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [];
  }

  static saveReviews(reviews: Review[]): void {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }

  static getConversations(): Conversation[] {
    const data = localStorage.getItem('freelance_marketplace_conversations');
    return data ? JSON.parse(data) : [];
  }

  static saveConversations(conversations: Conversation[]): void {
    localStorage.setItem('freelance_marketplace_conversations', JSON.stringify(conversations));
  }

  static getPayments(): Payment[] {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return data ? JSON.parse(data) : [];
  }

  static savePayments(payments: Payment[]): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }

  static getNotifications(): Notification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  }

  static saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  static getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static getBadges(): Badge[] {
    const data = localStorage.getItem(STORAGE_KEYS.BADGES);
    return data ? JSON.parse(data) : this.getDefaultBadges();
  }

  static saveBadges(badges: Badge[]): void {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
  }

  // Messaging methods
  static getMessages(): Message[] {
    const data = localStorage.getItem('freelance_marketplace_messages');
    return data ? JSON.parse(data) : [];
  }

  static saveMessages(messages: Message[]): void {
    localStorage.setItem('freelance_marketplace_messages', JSON.stringify(messages));
  }

  static getMessagesBetweenUsers(userId1: string, userId2: string, jobId?: string): Message[] {
    const allMessages = this.getMessages();
    return allMessages.filter(msg => 
      (msg.senderId === userId1 && msg.receiverId === userId2) ||
      (msg.senderId === userId2 && msg.receiverId === userId1)
    ).filter(msg => !jobId || msg.jobId === jobId);
  }

  static sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'read'>): Message {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    };

    const allMessages = this.getMessages();
    allMessages.push(newMessage);
    this.saveMessages(allMessages);

    // Update or create conversation
    this.updateConversation(newMessage);

    return newMessage;
  }

  static updateConversation(message: Message): void {
    const conversations = this.getConversations();
    const participants = [message.senderId, message.receiverId].sort();
    
    let conversation = conversations.find(conv => 
      conv.participants.sort().join(',') === participants.join(',') && 
      (!message.jobId || conv.jobId === message.jobId)
    );

    if (conversation) {
      conversation.lastMessage = message;
      conversation.updatedAt = message.createdAt;
    } else {
      conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participants,
        jobId: message.jobId,
        lastMessage: message,
        createdAt: message.createdAt,
        updatedAt: message.createdAt
      };
      conversations.push(conversation);
    }

    this.saveConversations(conversations);
  }

  static getConversationsForUser(userId: string): Conversation[] {
    const conversations = this.getConversations();
    return conversations.filter(conv => conv.participants.includes(userId));
  }

  static markMessagesAsRead(messageIds: string[]): void {
    const allMessages = this.getMessages();
    allMessages.forEach(msg => {
      if (messageIds.includes(msg.id)) {
        msg.read = true;
      }
    });
    this.saveMessages(allMessages);
  }

  // Chat methods (for legacy ChatPage)
  static getChats(): Chat[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : [];
  }

  static saveChats(chats: Chat[]): void {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }

  static getDefaultBadges(): Badge[] {
    return [
      {
        id: 'profile_complete',
        name: 'Profile Complete',
        description: 'Complete your profile with all information',
        icon: '👤',
        earnedAt: '',
        category: 'profile'
      },
      {
        id: 'first_bid',
        name: 'First Bid',
        description: 'Place your first bid on a project',
        icon: '🎯',
        earnedAt: '',
        category: 'bidding'
      },
      {
        id: 'first_job_posted',
        name: 'First Job Posted',
        description: 'Post your first job opportunity',
        icon: '📝',
        earnedAt: '',
        category: 'jobs'
      },
      {
        id: 'first_review',
        name: 'First Review',
        description: 'Receive or give your first review',
        icon: '⭐',
        earnedAt: '',
        category: 'reviews'
      },
      {
        id: 'active_chatter',
        name: 'Active Chatter',
        description: 'Send 10 messages in chats',
        icon: '💬',
        earnedAt: '',
        category: 'engagement'
      },
      {
        id: 'rising_star',
        name: 'Rising Star',
        description: 'Complete 5 successful projects',
        icon: '🌟',
        earnedAt: '',
        category: 'jobs'
      }
    ];
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  static initializeData(): void {
    if (this.getUsers().length === 0) {
      const sampleUsers: User[] = [
        {
          id: '1',
          email: 'freelancer@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          userType: 'freelancer',
          profile: {
            bio: 'Experienced full-stack developer with 5+ years of experience',
            title: 'Full Stack Developer',
            hourlyRate: 50,
            skills: ['React', 'TypeScript', 'Node.js', 'Python'],
            portfolio: [],
            location: 'New York, USA',
            languages: ['English', 'Spanish'],
            education: 'Bachelor of Computer Science',
            experience: '5 years of professional development experience'
          },
          badges: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'client@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
          userType: 'client',
          profile: {
            bio: 'Looking for talented developers for my projects',
            title: 'Project Manager',
            hourlyRate: 0,
            skills: ['Project Management', 'Agile', 'Scrum'],
            portfolio: [],
            location: 'San Francisco, USA',
            languages: ['English'],
            education: 'MBA in Project Management',
            experience: '10 years in project management'
          },
          badges: [],
          createdAt: new Date().toISOString()
        }
      ];
      this.saveUsers(sampleUsers);
    }

    if (this.getJobs().length === 0) {
      const sampleJobs: Job[] = [
        {
          id: '1',
          clientId: '2',
          title: 'Build a React Dashboard',
          description: 'Need a professional dashboard built with React and TypeScript',
          category: 'Web Development',
          budget: 1000,
          budgetType: 'fixed',
          duration: '2 weeks',
          skillsRequired: ['React', 'TypeScript', 'Tailwind CSS'],
          status: 'pending',
          createdAt: new Date().toISOString(),
          bids: [],
          invitedFreelancers: [],
          submission: undefined
        }
      ];
      this.saveJobs(sampleJobs);
    }

    if (this.getBadges().length === 0) {
      this.saveBadges(this.getDefaultBadges());
    }
  }
}
