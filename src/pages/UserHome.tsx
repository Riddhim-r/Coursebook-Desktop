import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav'
import LogoutButton from '../components/LogoutButton'
import PageHeader from '../components/PageHeader'

const UserHome = () => {
  return (
    <div className="page">
      <TopNav title="Coursebook" subtitle="User workspace" rightSlot={<LogoutButton />} />
      <div className="content">
        <PageHeader
          title="User Dashboard"
          description="Follow the plan, finish the checklist, archive the course."
          actionSlot={
            <Link className="btn primary" to="/user/courses">
              View Courses
            </Link>
          }
        />

        <div className="grid">
          <Link to="/user/helpbook" className="card link-card">
            <h3>Helpbook</h3>
            <p>Search, add, and refine troubleshooting steps.</p>
          </Link>
          <Link to="/user/ai-prompts" className="card link-card">
            <h3>AI Prompts</h3>
            <p>Search, add, and refine reusable prompts.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UserHome
