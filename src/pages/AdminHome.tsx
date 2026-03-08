import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import LogoutButton from "../components/LogoutButton";
import PageHeader from "../components/PageHeader";

const AdminHome = () => {
  return (
    <div className="page">
      <TopNav
        title="Coursebook"
        subtitle="Admin control"
        rightSlot={<LogoutButton />}
      />
      <div className="content">
        <PageHeader
          title="Admin Dashboard"
          description="Create courses, track progress, and manage shared knowledge."
          actionSlot={
            <Link className="btn primary" to="/admin/create-course">
              Create Course
            </Link>
          }
        />

        <div className="grid">
          <Link to="/admin/courses" className="card link-card">
            <h3>View Courses</h3>
            <p>See every course, progress bars, and archival status.</p>
          </Link>
          <Link to="/admin/helpbook" className="card link-card">
            <h3>Helpbook</h3>
            <p>Maintain the great library of solutions.</p>
          </Link>
          <Link to="/admin/ai-prompts" className="card link-card">
            <h3>Prompt-Craft</h3>
            <p>Maintain reusable prompts for every situation.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
