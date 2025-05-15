
# Family Calendar App

A collaborative calendar application for families to coordinate and share schedules.

## Project info

**URL**: https://lovable.dev/projects/999d3eee-49b8-4510-ba17-0fa532430221

## Features

- **Family Management**: Create and manage family groups
- **Event Calendar**: Share and coordinate events with family members
- **Member Roles**: Assign different roles (admin, member, child) to family members
- **Invitations**: Invite new members to join your family group
- **Event Sharing**: Choose which family members can see each event
- **Calendar Views**: Multiple calendar view options (day, week, month)

## Core Technologies

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Context API, Tanstack Query
- **Routing**: React Router

## Architecture

The application follows a modular architecture with these key components:

- **Authentication**: Supabase authentication with session management
- **Family Management**: Creation and management of family groups and members
- **Event System**: Creating, editing, and sharing events
- **Calendar Interface**: Interactive calendar with multiple views
- **Notification System**: In-app notifications for events and invitations

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/999d3eee-49b8-4510-ba17-0fa532430221) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Recent Improvements

- **Error Handling System**: Added centralized error handling with retry capabilities
- **Performance Optimizations**: Improved family member fetching with parallel loading
- **UI Component Helpers**: Created toast-helpers.tsx for properly typed toast notifications
- **Documentation Updates**: Expanded error logging and troubleshooting documentation
- **Testing Framework**: Enhanced test utilities for performance and reliability testing

## Project Documentation

- **BACKLOG.md**: Current development priorities and upcoming features
- **ERROR_LOG.md**: Documentation of encountered errors and their solutions
- **TEST_PLAN.md**: Comprehensive test plan for the application
- **src/docs/**: Additional technical documentation and guides

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/999d3eee-49b8-4510-ba17-0fa532430221) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Contributing

Before contributing to this project, please review:
- **ERROR_LOG.md**: To understand common issues and their solutions
- **TEST_PLAN.md**: For guidance on testing your changes
- **BACKLOG.md**: To see current priorities and upcoming features
