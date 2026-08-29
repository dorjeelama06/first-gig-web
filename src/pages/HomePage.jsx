import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { applyToJob, fetchAppliedJobIds } from "../lib/applications";
import { fetchBlockedIds } from "../lib/blocks";
import Navbar from "../components/shared/Navbar";
import JobCard from "../components/jobs/JobCard";
import JobDetail from "../components/jobs/JobDetail";
import LegalModal from "../components/shared/LegalModal";
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
  const [legalSection, setLegalSection] = useState(null); // "terms" | "privacy" | null
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationRadius, setLocationRadius] = useState(50);
  const [locationOpen, setLocationOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const locationRef = useRef(null);
  const categoryRef = useRef(null);
  const payRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, employers(id, company_name)")
        .or("is_closed.eq.false,is_closed.is.null")
        .order("created_at", { ascending: false });

      if (!error && data) {
        if (user) {
          const blockedIds = await fetchBlockedIds(user.id);
          setJobs(blockedIds.length === 0 ? data : data.filter(j => !blockedIds.includes(j.employers?.id)));
        } else {
          setJobs(data);
        }
        // No auto-select — user must tap a card on mobile
      }
      setLoading(false);
    };
    fetchJobs();
  }, [user]);

  // Load which jobs this seeker has already applied to
  useEffect(() => {
    if (user) {
      fetchAppliedJobIds(user.id).then(setAppliedJobIds);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocationOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpen(false);
      if (payRef.current && !payRef.current.contains(e.target)) setPayOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = jobs.filter(job => {
    // text search
    const q = search.toLowerCase();
    const matchSearch = !q
      || job.job_title?.toLowerCase().includes(q)
      || job.employers?.company_name?.toLowerCase().includes(q)
      || (job.job_category || []).some(c => c.toLowerCase().includes(q));

    // category chip
    const matchCat = activeCategory === ALL || (job.job_category || []).includes(activeCategory);

    // pay range — negotiable / unspecified always pass; otherwise compare pay_min
    const minF = payMin !== "" ? parseFloat(payMin) : null;
    const maxF = payMax !== "" ? parseFloat(payMax) : null;
    const jobPay = job.pay_min != null ? parseFloat(job.pay_min) : null;
    const matchPay = (minF === null && maxF === null)
      || job.pay_type === "negotiable"
      || jobPay === null
      || (minF !== null && maxF !== null ? jobPay >= minF && jobPay <= maxF
        : minF !== null ? jobPay >= minF
        : jobPay <= maxF);

    // location — remote always passes; match city, state or zip
    const loc = locationQuery.trim().toLowerCase();
    const matchLocation = !loc
      || job.is_remote
      || job.job_city?.toLowerCase().includes(loc)
      || job.job_state?.toLowerCase().includes(loc)
      || job.job_zip?.toLowerCase().includes(loc);

    return matchSearch && matchCat && matchPay && matchLocation;
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

  const advFilterCount = [payMin, payMax, locationQuery].filter(Boolean).length;
  const hasAnyFilter = activeCategory !== ALL || advFilterCount > 0;
  const clearAdvanced = () => { setPayMin(""); setPayMax(""); setLocationQuery(""); setLocationRadius(50); };

  const payChipLabel = payMin && payMax ? `$${payMin}–$${payMax}/hr`
    : payMin ? `$${payMin}+/hr`
    : payMax ? `Up to $${payMax}/hr`
    : "Pay";
  const closeAll = () => { setCategoryOpen(false); setLocationOpen(false); setPayOpen(false); };

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

      {/* Handshake-style header: search left · filter chips right */}
      <div className="gs-home-search">
        <div className="gs-home-search-inner">

          {/* Left: search input + mobile filter button */}
          <div className="gs-home-search-left">
            <div className="gs-filter-bar">
              <input
                className="gs-search-input"
                placeholder="🔍  Search by job title, company, or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {/* Mobile-only filter trigger */}
              <button
                className={`gs-filter-btn${hasAnyFilter ? " has-filter" : ""}`}
                onClick={() => setFilterOpen(true)}
              >
                {hasAnyFilter ? `Filters${advFilterCount + (activeCategory !== ALL ? 1 : 0) > 1 ? ` (${advFilterCount + (activeCategory !== ALL ? 1 : 0)})` : activeCategoryLabel ? `: ${activeCategoryLabel}` : ""}` : "Filter"}
              </button>
            </div>
          </div>

          {/* Right: Category · Pay · Location chips (desktop) */}
          <div className="gs-home-search-right">

            {/* ── Category ── */}
            <div className="gs-dropdown-wrap" ref={categoryRef}>
              <button
                className={`gs-dropdown-chip${activeCategory !== ALL ? " active" : categoryOpen ? " open" : ""}`}
                onClick={() => { setCategoryOpen(o => !o); setLocationOpen(false); setPayOpen(false); }}
              >
                {activeCategory !== ALL
                  ? `${CATEGORY_OPTIONS.find(o => o.id === activeCategory)?.icon} ${CATEGORY_OPTIONS.find(o => o.id === activeCategory)?.label}`
                  : "Category"}
                <span className={`gs-chip-chevron${categoryOpen ? " up" : ""}`} />
              </button>
              {categoryOpen && (
                <div className="gs-category-dropdown">
                  <button className={`gs-cat-option${activeCategory === ALL ? " active" : ""}`}
                    onClick={() => { setActiveCategory(ALL); setCategoryOpen(false); }}>All Jobs</button>
                  {CATEGORY_OPTIONS.map(o => (
                    <button key={o.id}
                      className={`gs-cat-option${activeCategory === o.id ? " active" : ""}`}
                      onClick={() => { setActiveCategory(o.id); setCategoryOpen(false); }}>
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Pay ── */}
            <div className="gs-dropdown-wrap" ref={payRef}>
              <button
                className={`gs-dropdown-chip${(payMin || payMax) ? " active" : payOpen ? " open" : ""}`}
                onClick={() => { setPayOpen(o => !o); setCategoryOpen(false); setLocationOpen(false); }}
              >
                {payChipLabel}
                <span className={`gs-chip-chevron${payOpen ? " up" : ""}`} />
              </button>
              {payOpen && (
                <div className="gs-pay-dropdown">
                  <p className="gs-location-dropdown-title">Pay Range</p>
                  <div className="gs-pay-dropdown-inputs">
                    <div className="gs-adv-pay-wrap">
                      <span className="gs-adv-dollar">$</span>
                      <input className="gs-adv-input" type="number" min="0" placeholder="Min"
                        value={payMin} onChange={e => setPayMin(e.target.value)} autoFocus />
                    </div>
                    <span className="gs-pay-dash">–</span>
                    <div className="gs-adv-pay-wrap">
                      <span className="gs-adv-dollar">$</span>
                      <input className="gs-adv-input" type="number" min="0" placeholder="Max"
                        value={payMax} onChange={e => setPayMax(e.target.value)} />
                    </div>
                  </div>
                  <div className="gs-location-dropdown-footer">
                    {(payMin || payMax) && (
                      <button className="gs-location-clear"
                        onClick={() => { setPayMin(""); setPayMax(""); }}>Clear</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Location ── */}
            <div className="gs-dropdown-wrap" ref={locationRef}>
              <button
                className={`gs-dropdown-chip${locationQuery ? " active" : locationOpen ? " open" : ""}`}
                onClick={() => { setLocationOpen(o => !o); setCategoryOpen(false); setPayOpen(false); }}
              >
                📍 Location
                <span className={`gs-chip-chevron${locationOpen ? " up" : ""}`} />
              </button>
              {locationOpen && (
                <div className="gs-location-dropdown">
                  <p className="gs-location-dropdown-title">Location</p>
                  <div className="gs-location-search-wrap">
                    <input className="gs-location-search-input" type="text"
                      placeholder="Search by city, state, or zip code"
                      value={locationQuery} onChange={e => setLocationQuery(e.target.value)} autoFocus />
                    <span className="gs-location-search-icon">🔍</span>
                  </div>
                  <p className="gs-location-radius-label">
                    Search radius for locations: <strong>{locationRadius} miles</strong>
                  </p>
                  <input className="gs-location-slider" type="range" min="1" max="100"
                    value={locationRadius} onChange={e => setLocationRadius(parseInt(e.target.value))}
                    style={{ background: `linear-gradient(to right, #1a1a2e 0%, #1a1a2e ${(locationRadius - 1) / 99 * 100}%, #e0e0e0 ${(locationRadius - 1) / 99 * 100}%, #e0e0e0 100%)` }}
                  />
                  <div className="gs-location-slider-labels">
                    <span>1 mile</span><span>100 miles</span>
                  </div>
                  <div className="gs-location-dropdown-footer">
                    {(locationQuery || locationRadius !== 50) && (
                      <button className="gs-location-clear"
                        onClick={() => { setLocationQuery(""); setLocationRadius(50); }}>Clear</button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>{/* end gs-home-search-right */}

        </div>{/* end gs-home-search-inner */}

        {/* Mobile filter bottom sheet */}
        {filterOpen && (
          <>
            <div className="gs-filter-sheet-backdrop" onClick={() => setFilterOpen(false)} />
            <div className="gs-filter-sheet">
              <div className="gs-filter-sheet-header">
                <span className="gs-filter-sheet-title">Filter by Category</span>
                <button className="gs-filter-sheet-done" onClick={() => setFilterOpen(false)}>Done</button>
              </div>
              <div className="gs-filter-sheet-section-title">Category</div>
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

              {/* Pay range */}
              <div className="gs-filter-sheet-section">
                <div className="gs-filter-sheet-section-title">Pay Range ($/hr)</div>
                <div className="gs-filter-sheet-pay-row">
                  <div className="gs-adv-pay-wrap">
                    <span className="gs-adv-dollar">$</span>
                    <input
                      className="gs-adv-input"
                      type="number" min="0" placeholder="Min"
                      value={payMin}
                      onChange={e => setPayMin(e.target.value)}
                    />
                  </div>
                  <span className="gs-filter-sheet-pay-dash">–</span>
                  <div className="gs-adv-pay-wrap">
                    <span className="gs-adv-dollar">$</span>
                    <input
                      className="gs-adv-input"
                      type="number" min="0" placeholder="Max"
                      value={payMax}
                      onChange={e => setPayMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="gs-filter-sheet-section">
                <div className="gs-filter-sheet-section-title">Location</div>
                <div className="gs-filter-sheet-location-body">
                  <div className="gs-location-search-wrap">
                    <input
                      className="gs-location-search-input"
                      type="text" placeholder="Search by city, state, or zip code"
                      value={locationQuery}
                      onChange={e => setLocationQuery(e.target.value)}
                    />
                    <span className="gs-location-search-icon">🔍</span>
                  </div>
                  <p className="gs-location-radius-label" style={{ margin: "14px 0 8px" }}>
                    Search radius for locations: <strong>{locationRadius} miles</strong>
                  </p>
                  <input
                    className="gs-location-slider"
                    type="range" min="1" max="100"
                    value={locationRadius}
                    onChange={e => setLocationRadius(parseInt(e.target.value))}
                    style={{ background: `linear-gradient(to right, #1a1a2e 0%, #1a1a2e ${(locationRadius - 1) / 99 * 100}%, #e0e0e0 ${(locationRadius - 1) / 99 * 100}%, #e0e0e0 100%)` }}
                  />
                  <div className="gs-location-slider-labels">
                    <span>1 mile</span>
                    <span>100 miles</span>
                  </div>
                </div>
              </div>

              {(payMin || payMax || locationQuery || locationRadius !== 50) && (
                <div style={{ padding: "0 20px 8px" }}>
                  <button className="gs-filter-sheet-clear" onClick={clearAdvanced}>
                    ✕ Clear pay &amp; location filters
                  </button>
                </div>
              )}
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

      {/* Footer */}
      <footer className="gs-home-footer">
        <span className="gs-footer-copy">© {new Date().getFullYear()} First Gig</span>
        <span className="gs-footer-sep">·</span>
        <button className="gs-footer-link" onClick={() => setLegalSection("terms")}>Terms of Service</button>
        <span className="gs-footer-sep">·</span>
        <button className="gs-footer-link" onClick={() => setLegalSection("privacy")}>Privacy Policy</button>
      </footer>

      {/* Legal modal overlay */}
      {legalSection && (
        <LegalModal section={legalSection} onClose={() => setLegalSection(null)} />
      )}
    </div>
  );
}
