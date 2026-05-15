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
  const [filterOpen, setFilterOpen] = useState(false);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, employers(company_name)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setJobs(data);
        // No auto-select — user must tap a card on mobile
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

  const activeCategoryLabel = activeCategory !== ALL
    ? CATEGORY_OPTIONS.find(o => o.id === activeCategory)?.label ?? ""
    : null;

  return (
    <div className="gs-home-wrap">
      <Navbar
        user={user}
        onLogin={onLogin}
        onRegister={onRegister}
        onSignOut={handleSignOut}
        onDashboard={onDashboard}
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      {/* Search + category filters */}
      <div className="gs-home-search">
        {/* Search bar row — on mobile wraps input + Filter button */}
        <div className="gs-filter-bar">
          <input
            className="gs-search-input"
            placeholder="🔍  Search by job title, company, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Mobile-only filter trigger */}
          <button
            className={`gs-filter-btn${activeCategory !== ALL ? " has-filter" : ""}`}
            onClick={() => setFilterOpen(true)}
          >
            {activeCategoryLabel ? `${activeCategoryLabel}` : "Filter"}
          </button>
        </div>

        {/* Desktop chips row */}
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

        {/* Mobile filter bottom sheet */}
        {filterOpen && (
          <>
            <div className="gs-filter-sheet-backdrop" onClick={() => setFilterOpen(false)} />
            <div className="gs-filter-sheet">
              <div className="gs-filter-sheet-header">
                <span className="gs-filter-sheet-title">Filter by Category</span>
                <button className="gs-filter-sheet-done" onClick={() => setFilterOpen(false)}>Done</button>
              </div>
              <div className="gs-filter-sheet-chips">
                <button
                  className={`gs-filter-chip ${activeCategory === ALL ? "active" : ""}`}
                  onClick={() => { setActiveCategory(ALL); setFilterOpen(false); }}>
                  All Jobs
                </button>
                {CATEGORY_OPTIONS.map(o => (
                  <button
                    key={o.id}
                    className={`gs-filter-chip ${activeCategory === o.id ? "active" : ""}`}
                    onClick={() => { setActiveCategory(o.id); setFilterOpen(false); }}>
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
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
                onClick={() => { setSelectedJob(job); setJobDetailOpen(true); }}
              />
            ))
          )}
        </div>

        {/* Desktop: right panel (always visible, shows placeholder when no job selected) */}
        <div className="gs-jobs-right gs-jobs-right--desktop">
          <JobDetail job={selectedJob} user={user} onApply={handleApply} appliedJobIds={appliedJobIds} />
        </div>
      </div>

      {/* Mobile: full-screen job detail overlay */}
      {jobDetailOpen && selectedJob && (
        <div className="gs-detail-overlay">
          <JobDetail
            job={selectedJob}
            user={user}
            onApply={handleApply}
            appliedJobIds={appliedJobIds}
            onClose={() => setJobDetailOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
