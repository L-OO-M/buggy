import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import { GuestOnly, ProtectedRoute, RoleRoute } from './components/ProtectedRoute.jsx';
import Landing from './pages/public/Landing.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import ExploreEvents from './pages/public/ExploreEvents.jsx';
import EventDetails from './pages/public/EventDetails.jsx';
import CheckIn from './pages/public/CheckIn.jsx';
import ExploreClubs from './pages/public/ExploreClubs.jsx';
import ClubDetails from './pages/public/ClubDetails.jsx';
import ExploreChallenges from './pages/public/ExploreChallenges.jsx';
import ChallengeDetails from './pages/public/ChallengeDetails.jsx';
import UserProfile from './pages/public/UserProfile.jsx';
import StudentDashboard from './pages/student/Dashboard.jsx';
import MyRegistrations from './pages/student/MyRegistrations.jsx';
import MyTeams from './pages/student/MyTeams.jsx';
import TeamDetails from './pages/student/TeamDetails.jsx';
import MySubmissions from './pages/student/MySubmissions.jsx';
import Achievements from './pages/student/Achievements.jsx';
import Leaderboards from './pages/student/Leaderboards.jsx';
import Notifications from './pages/student/Notifications.jsx';
import Profile from './pages/student/Profile.jsx';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard.jsx';
import OrganizerEvents from './pages/organizer/Events.jsx';
import EventForm from './pages/organizer/EventForm.jsx';
import OrganizerChallenges from './pages/organizer/Challenges.jsx';
import ChallengeForm from './pages/organizer/ChallengeForm.jsx';
import ChallengeParticipants from './pages/organizer/ChallengeParticipants.jsx';
import ReviewSubmissions from './pages/organizer/ReviewSubmissions.jsx';
import AttendanceDesk from './pages/organizer/AttendanceDesk.jsx';
import OrganizerClubs from './pages/organizer/Clubs.jsx';
import ManageClub from './pages/organizer/ManageClub.jsx';
import OrganizerAnalytics from './pages/organizer/OrganizerAnalytics.jsx';
import Announcements from './pages/organizer/Announcements.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminClubs from './pages/admin/AdminClubs.jsx';
import AdminEvents from './pages/admin/AdminEvents.jsx';
import AdminChallenges from './pages/admin/AdminChallenges.jsx';
import AdminSubmissions from './pages/admin/AdminSubmissions.jsx';
import AdminRewards from './pages/admin/AdminRewards.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminActivity from './pages/admin/AdminActivity.jsx';
import NotFound from './pages/NotFound.jsx';

function LeaderboardMode() {
  return <Leaderboards mode="individual" />;
}

function TeamLeaderboardMode() {
  return <Leaderboards mode="teams" />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="events" element={<ExploreEvents />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="clubs" element={<ExploreClubs />} />
        <Route path="clubs/:slug" element={<ClubDetails />} />
        <Route path="challenges" element={<ExploreChallenges />} />
        <Route path="challenges/:id" element={<ChallengeDetails />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="profile/:id" element={<UserProfile />} />
        <Route path="leaderboards" element={<Navigate to="/leaderboards/individual" replace />} />
        <Route path="leaderboards/individual" element={<LeaderboardMode />} />
        <Route path="leaderboards/teams" element={<TeamLeaderboardMode />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<GuestOnly />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute roles={['student']} />}>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="registrations" element={<MyRegistrations />} />
            <Route path="teams" element={<MyTeams />} />
            <Route path="teams/:id" element={<TeamDetails />} />
            <Route path="submissions" element={<MySubmissions />} />
            <Route path="achievements" element={<Achievements />} />
          </Route>

          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />

          <Route element={<RoleRoute roles={['organizer']} />}>
            <Route path="organizer" element={<OrganizerDashboard />} />
            <Route path="organizer/events" element={<OrganizerEvents />} />
            <Route path="organizer/events/new" element={<EventForm />} />
            <Route path="organizer/events/:id/edit" element={<EventForm />} />
            <Route path="organizer/challenges" element={<OrganizerChallenges />} />
            <Route path="organizer/challenges/new" element={<ChallengeForm />} />
            <Route path="organizer/challenges/:id/edit" element={<ChallengeForm />} />
            <Route path="organizer/challenges/:id/participants" element={<ChallengeParticipants />} />
            <Route path="organizer/submissions" element={<ReviewSubmissions />} />
            <Route path="organizer/attendance" element={<AttendanceDesk />} />
            <Route path="organizer/clubs" element={<OrganizerClubs />} />
            <Route path="organizer/clubs/:id" element={<ManageClub />} />
            <Route path="organizer/analytics" element={<OrganizerAnalytics />} />
            <Route path="organizer/announcements" element={<Announcements />} />
          </Route>

          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/clubs" element={<AdminClubs />} />
            <Route path="admin/events" element={<AdminEvents />} />
            <Route path="admin/challenges" element={<AdminChallenges />} />
            <Route path="admin/submissions" element={<AdminSubmissions />} />
            <Route path="admin/rewards" element={<AdminRewards />} />
            <Route path="admin/reports" element={<AdminReports />} />
            <Route path="admin/activity" element={<AdminActivity />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
