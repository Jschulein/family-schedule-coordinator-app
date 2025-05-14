
export interface Event {
  id?: string;
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  familyMembers?: string[];
  creatorId: string;
  familyMember?: string;
  all_day?: boolean;
}

export interface UserProfile {
  id: string;
  full_name?: string | null;
  Email?: string | null;
}

export interface EventContextType {
  events: Event[];
  addEvent: (event: Event) => Promise<Event | void>;
  updateEvent: (event: Event) => Promise<Event | void>;
  deleteEvent: (eventId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  offlineMode: boolean;
  refetchEvents: (showToast?: boolean) => Promise<void>;
}
