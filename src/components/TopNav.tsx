import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type TopNavProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  hideMark?: boolean;
};

const TopNav = ({ title, subtitle, rightSlot, hideMark }: TopNavProps) => {
  return (
    <header className="top-nav">
      <div>
        <Link to="/" className="brand">
          {hideMark ? null : <span className="brand-mark">CB</span>}
          <span className={hideMark ? "brand-text brand-hero" : "brand-text"}>
            {title}
          </span>
        </Link>
        {subtitle ? <p className="subtle">{subtitle}</p> : null}
      </div>
      <div className="nav-actions">{rightSlot}</div>
    </header>
  );
};

export default TopNav;
