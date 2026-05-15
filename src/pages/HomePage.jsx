import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { applyToJob, fetchAppliedJobIds } from "../lib/applications";
import Navbar from "../components/shared/Navbar";
import JobCard from "../components/jobs/JobCard";
import JobDetail from "../components/jobs/JobDetail";
import { CATEGORY_OPTIONS } from "../constants/options";
import "../styles/homepage.css";

const ALL = "all";

export default function HomePage({ user, onLogin, onRegister, onSignOut, onDashboard }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, employers(company_name)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setJobs(data);
        if (data.length > 0) setSelectedJob(data[0]);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  // Load which jobs this seeker has already applied to
  useEffect(() => {
    if (user) {
      fetchAppliedJobIds(user.id).then(setAppliedJobIds);
    }
  }, [user]);

  const filtered = jobs.filter(job => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || job.job_title?.toLowerCase().includes(q)
      || job.employers?.company_name?.toLowerCase().includes(q)
      || (job.job_category || []).some(c => c.toLowerCase().includes(q));
    const matchCat = activeCategory === ALL || (job.job_category || []).includes(activeCategory);
    return matchSearch && matchCat;
  });

  const handleApply = async (job) => {
    if (!user) { onRegister(); return null; }
    const result = await applyToJob(job.id, user.id, job.employer_id);
    if (!result.alreadyApplied) {
      setAppliedJobIds(prev => [...prev, job.id]);
    }
    return { success: true, alreadyApplied: result.alreadyApplied };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <div className="gs-home-wrap">
      <Navbar
        user={user}
        onLogin={onLogin}
        onRegister={onRegister}
        onSignOut={handleSignOut}
        onDashboard={onDashboard}
      />

      {/* Search + category filters */}
      <div className="gs-home-search">
        <input
          className="gs-search-input"
          placeholder="🔍  Search by job title, company, or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="gs-filter-chips">
          <button
            className={`gs-filter-chip ${activeCategory === ALL ? "active" : ""}`}
            onClick={() => setActiveCategory(ALL)}>
            All Jobs
          </button>
          {CATEGORY_OPTIONS.map(o => (
            <button
              key={o.id}
              className={`gs-filter-chip ${activeCategory === o.id ? "active" : ""}`}
              onClick={() => setActiveCategory(o.id)}>
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gs-home-body">
        {/* Left column — job cards */}
        <div className="gs-jobs-list">
          <div className="gs-results-count">
            {loading ? "Loading jobs..." : `${filtered.length} job${filtered.length !== 1 ? "s" : ""} found`}
          </div>

          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="gs-skeleton-card">
                <div className="gs-skeleton-line" style={{ height: 16, width: "60%", marginBottom: 8 }} />
                <div className="gs-skeleton-line" style={{ height: 13, width: "40%", marginBottom: 8 }} />
                <div className="gs-skeleton-line" style={{ height: 13, width: "80%", marginBottom: 8 }} />
                <div className="gs-skeleton-line" style={{ height: 22, width: "50%", marginBottom: 0 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="gs-empty">
              <div className="gs-empty-icon">🔍</div>
              <p className="gs-empty-title">No jobs found</p>
              <p className="gs-empty-desc">Try a different search or category filter</p>
            </div>
          ) : (
            filtered.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isActive={selectedJob?.id === job.id}
                onClick={() => setSelectedJob(job)}
              />
            ))
          )}
        </div>

        {/* Right column — job detail */}
        <div className="gs-jobs-right">
          <JobDetail job={selectedJob} user={user} onApply={handleApply} appliedJobIds={appliedJobIds} />
        </div>
      </div>
    </div>
  );
}
