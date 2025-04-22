# PRD (Product Requirements Document)

## 1. Goals
- **Central Coordination:** Enable families to coordinate and view each other’s schedules in one centralized calendar.
- **Event Management:** Allow users to add events with custom details and invite other family members.
- **User-Friendly Interface:** Provide a shared calendar view that is visually easy to navigate and filter by member or date.

## 2. User Personas

### Parent/Admin
- Sets up the account and invites family members.

### Family Member (Adult/Teen)
- Receives invite, logs in, adds events, and views the calendar.

### Young Child (Optional)
- Can be invited to events, but doesn’t log in directly.

## 3. Key User Flows

### User Onboarding
1. **Receive Invite Email:** User receives an invitation email.
2. **Account Creation:** Click the link, enter email, create a password, and the profile is created.

### Enter Events
1. **Login:** User logs in to the app.
2. **Select "Enter Events":** Navigate to the event entry form.
3. **Fill Out the Form:**
   - **Event Name:** (Required)
   - **Date:** (Required)
   - **Description:** (Optional)
   - **Invite Family Members:** (Multi-select option)
4. **Submit Form:** Event is saved.
5. **Notify Invitees:** Invited members receive a notification with an option to accept or decline.

### View Family’s Events
1. **Login:** User logs in.
2. **Select "View Family’s Events":** Calendar view loads.
3. **Features:**
   - Filter events by family member and date range.
   - Display color-coded events per user to easily distinguish them.

## 4. Core Features
- **User Authentication:** Email and password based.
- **Event Creation:** Dynamic event form submission.
- **Multi-User Invitations:** Ability to invite family members to events.
- **RSVP Management:** Option for invitees to accept or decline an event.
- **Shared Calendar View:** Displays events with filters and color coding.
- **Notifications:** Inform users of new event invites.
- **Responsive Design:** Mobile-first approach for seamless user experience on all devices.

---
## Database Schema & Relationships

### Tables and Key Fields

#### 1. Users

| Field           | Type       | Description                          |
|-----------------|------------|--------------------------------------|
| `id`            | UUID (PK)  | Unique user identifier               |
| `name`          | Text       | Full name                            |
| `email`         | Text       | Unique email address                 |
| `password_hash` | Text       | Hashed password                      |
| `color_code`    | Text       | Unique color for calendar view       |

#### 2. Events

| Field        | Type        | Description                                      |
|--------------|-------------|--------------------------------------------------|
| `id`         | UUID (PK)   | Unique event identifier                          |
| `creator_id` | UUID (FK)   | Creator of the event (references Users.id)       |
| `name`       | Text        | Event name                                       |
| `description`| Text        | Optional event details                           |
| `date`       | DateTime    | Date and time of the event                       |
| `created_at` | DateTime    | Timestamp when event was created                 |

#### 3. Event_Invites

| Field      | Type       | Description                                            |
|------------|------------|--------------------------------------------------------|
| `id`       | UUID (PK)  | Unique identifier                                      |
| `event_id` | UUID (FK)  | Linked event (references Events.id)                    |
| `user_id`  | UUID (FK)  | Invited user (references Users.id)                     |
| `status`   | Enum       | RSVP status: 'Pending', 'Accepted', 'Declined'         |

### Relationships
- **Users to Events:** A user can create many events.
- **Events to Event_Invites:** An event can have many invites.
- **Users to Event_Invites:** A user can be invited to many events through event invites.

---



