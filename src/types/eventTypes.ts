
export interface Event {
  id?: string;
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
  all_day: boolean;
  familyMember?: string; // Re-added for backward compatibility
}

export interface EventContextType {
  events: Event[];
  addEvent: (event: Event) => Promise<Event | undefined>;
  updateEvent: (event: Event) => Promise<Event | undefined>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  loading: boolean;
  initialLoading: boolean; 
  operationLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  offlineMode: boolean;
  refetchEvents: (showToast?: boolean) => Promise<void>;
}
