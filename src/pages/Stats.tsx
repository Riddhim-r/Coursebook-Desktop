import TopNav from '../components/TopNav'
import LogoutButton from '../components/LogoutButton'

const Stats = () => {
  return (
    <div className="page">
      <TopNav title="Coursebook" subtitle="Admin control" rightSlot={<LogoutButton />} />
      <div className="content" />
    </div>
  )
}

export default Stats