
# PRD (Product Requirements Document)

## 1. Goals
- **Central Coordination:** Enable families to coordinate and view each other's schedules in one centralized calendar.
- **Event Management:** Allow users to add events with custom details and invite other family members.
- **User-Friendly Interface:** Provide a shared calendar view that is visually easy to navigate and filter by member or date.

## 2. User Personas

### Parent/Admin
- Sets up the account and invites family members.
- Creates and manages family groups.
- Has full control over family events and memberships.

### Family Member (Adult/Teen)
- Receives invite, logs in, adds events, and views the calendar.
- Can create their own events and share them with the family.

### Young Child (Optional)
- Can be invited to events, but doesn't log in directly.
- Represented in the system by a parent/guardian.

## 3. Key User Flows

### User Onboarding
1. **User Registration:** User creates an account with email and password.
2. **Create Profile:** User's profile is automatically created upon registration.
3. **Create Family:** User can create one or more family groups.
4. **Invite Family Members:** User sends invitations to family members via email.
5. **Accept Invitation:** Invited members receive an email and can accept to join the family.

### Family Management
1. **Create Family:** User creates a family group with a name and becomes its admin.
2. **Invite Members:** User invites others to join their family with specific roles (admin, member, child).
3. **View Family Members:** User can see all members of their family groups.
4. **Switch Between Families:** User with multiple families can switch between them.

### Enter Events
1. **Login:** User logs in to the app.
2. **Select "Enter Events":** Navigate to the event entry form.
3. **Fill Out the Form:**
   - **Event Name:** (Required)
   - **Date and Time:** (Required)
   - **End Date and Time:** (Optional)
   - **All-Day Option:** Toggle for all-day events
   - **Description:** (Optional)
   - **Share with Family Members:** Select which family members to share with
4. **Submit Form:** Event is saved and appears in the calendar.
5. **Notifications:** Family members receive notifications about new shared events.

### View Family's Events
1. **Login:** User logs in.
2. **Calendar View:** Interactive calendar shows all accessible events.
3. **Features:**
   - Toggle between day, week, and month views
   - Filter events by family member
   - Display color-coded events per user
   - View upcoming events list
   - Quick navigation between dates

## 4. Core Features
- **User Authentication:** Email and password based login/signup.
- **Profile Management:** User profiles with customizable settings.
- **Family Creation & Management:** Create and manage family groups.
- **Member Invitations:** Invite family members with different roles.
- **Event Creation:** Full-featured event form with sharing options.
- **Shared Calendar View:** Interactive calendar with multiple view options.
- **Notifications:** System to inform users about new events and invitations.
- **Responsive Design:** Mobile-first approach for all devices.

---
## Database Schema & Relationships

### Tables and Key Fields

#### 1. Profiles (extends auth.users)

| Field                    | Type       | Description                          |
|--------------------------|------------|--------------------------------------|
| `id`                     | UUID (PK)  | Unique user identifier (refs auth.users) |
| `full_name`              | Text       | Full name                            |
| `Email`                  | Text       | Email address                        |
| `notification_preferences` | JSON     | User notification settings           |
| `created_at`             | DateTime   | When profile was created             |
| `updated_at`             | DateTime   | When profile was last updated        |

#### 2. Families

| Field        | Type        | Description                                  |
|--------------|-------------|----------------------------------------------|
| `id`         | UUID (PK)   | Unique family identifier                     |
| `name`       | Text        | Family name                                  |
| `created_by` | UUID        | Creator of the family (references auth.users)|
| `created_at` | DateTime    | When family was created                      |
| `color`      | Text        | Color code for the family                    |

#### 3. Family_Members

| Field        | Type        | Description                                  |
|--------------|-------------|----------------------------------------------|
| `id`         | UUID (PK)   | Unique identifier                            |
| `family_id`  | UUID (FK)   | Family reference                             |
| `user_id`    | UUID        | User reference                               |
| `email`      | Text        | Member's email                               |
| `name`       | Text        | Member's name                                |
| `role`       | Enum        | Role in family: 'admin', 'member', 'child'   |
| `joined_at`  | DateTime    | When user joined the family                  |

#### 4. Invitations

| Field          | Type        | Description                                  |
|----------------|-------------|----------------------------------------------|
| `id`           | UUID (PK)   | Unique identifier                            |
| `family_id`    | UUID (FK)   | Family reference                             |
| `email`        | Text        | Invitee's email                              |
| `role`         | Enum        | Assigned role: 'admin', 'member', 'child'    |
| `invited_by`   | UUID        | User who sent the invitation                 |
| `invited_at`   | DateTime    | When invitation was created                  |
| `last_invited` | DateTime    | When invitation was last sent                |
| `status`       | Text        | Status: 'pending', 'accepted', 'declined'    |

#### 5. Events

| Field        | Type        | Description                                      |
|--------------|-------------|--------------------------------------------------|
| `id`         | UUID (PK)   | Unique event identifier                          |
| `creator_id` | UUID        | Creator of the event (references auth.users)     |
| `name`       | Text        | Event name                                       |
| `description`| Text        | Optional event details                           |
| `date`       | DateTime    | Date and time of the event                       |
| `end_date`   | DateTime    | End date and time of the event (optional)        |
| `time`       | Time        | Time component of the event                      |
| `all_day`    | Boolean     | Whether the event is all day                     |
| `created_at` | DateTime    | When event was created                           |

#### 6. Event_Families

| Field        | Type        | Description                                      |
|--------------|-------------|--------------------------------------------------|
| `id`         | UUID (PK)   | Unique identifier                                |
| `event_id`   | UUID (FK)   | Event reference                                  |
| `family_id`  | UUID (FK)   | Family reference                                 |
| `shared_by`  | UUID        | User who shared the event                        |
| `shared_at`  | DateTime    | When the event was shared                        |

#### 7. Notifications

| Field        | Type        | Description                                      |
|--------------|-------------|--------------------------------------------------|
| `id`         | UUID (PK)   | Unique identifier                                |
| `user_id`    | UUID        | Target user                                      |
| `title`      | Text        | Notification title                               |
| `message`    | Text        | Notification message                             |
| `type`       | Text        | Notification type                                |
| `read`       | Boolean     | Whether notification has been read               |
| `created_at` | DateTime    | When notification was created                    |
| `action_url` | Text        | URL to navigate when clicking notification       |
| `metadata`   | JSON        | Additional data related to notification          |

### Relationships
- **Profiles to Families:** Many-to-many through family_members.
- **Profiles to Events:** A profile can create many events (creator_id).
- **Families to Events:** Many-to-many through event_families.
- **Families to Invitations:** A family can have many invitations.
- **Profiles to Notifications:** A profile can have many notifications.

### Security Model
The application implements Row-Level Security (RLS) at the database level to ensure:
1. Users can only see families they are members of
2. Users can only see events they created or that are shared with their families
3. Admin users have additional permissions within their families
4. Special security definer functions prevent recursive permission checking

---

## Implementation Details

### Authentication
- Supabase authentication using JWT tokens
- Email/password authentication with session persistence
- Profile creation triggered on user signup

### Family Management
- Security definer functions for safe family access
- Role-based permissions within families
- Invitation system with email notifications

### Event Sharing
- Events can be shared with multiple families
- Family-based access control for viewing events
- Creator maintains ownership and edit rights

### Notifications
- In-app notification system
- Notifications for key actions (invitations, new events)
- Configurable notification preferences

