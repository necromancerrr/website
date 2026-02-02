"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";
import { usePrivy } from "@privy-io/react-auth";
import type { Session } from "@supabase/supabase-js";
import type { Job, CareerField } from "@/types/career";
import { CAREER_FIELD_LABELS, CAREER_FIELD_OPTIONS } from "@/types/career";
import { Search, ExternalLink, ChevronDown, ArrowUpDown } from "lucide-react";

export default function JobsPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
    };

    getSession();
  }, []);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState<CareerField[]>([]);
  const [showReferralOnly, setShowReferralOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Check if user is authenticated via either Supabase or Privy
  const isAuthenticated = user || (ready && authenticated);

  // Fetch jobs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
    }
  }, [isAuthenticated]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const result = await response.json();
      if (response.ok) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCareerField = (field: CareerField) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const clearFilters = () => {
    setSelectedFields([]);
    setShowReferralOnly(false);
    setSearchQuery("");
  };

  const filteredJobs = jobs.filter(job => {
    const matchesCareerFields = selectedFields.length === 0 || 
      job.career_fields?.some(f => selectedFields.includes(f));
    const matchesReferral = !showReferralOnly || job.referral_available === true;
    const matchesSearch = !searchQuery || 
      (job.company?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       job.position?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCareerFields && matchesReferral && matchesSearch;
  });

  // Sort by date
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const hasActiveFilters = selectedFields.length > 0 || showReferralOnly || searchQuery;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="text-2xl font-medium text-white mb-3">
            Job Board
          </h1>
          <p className="text-zinc-400 mb-6 text-sm">
            Sign in to access opportunities curated for the UW Blockchain community.
          </p>
          <button
            onClick={() => router.push("/career-portal")}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-4"
          >
            Sign in to career portal →
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-20 text-zinc-500 text-sm">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-xl font-medium text-white">
              UW Blockchain Jobs
            </h1>
            <span className="text-xs text-zinc-500">
              {sortedJobs.length} {sortedJobs.length === 1 ? 'posting' : 'postings'}
            </span>
          </div>
          
          <p className="text-sm text-zinc-400 leading-relaxed">
            Opportunities from the UW Blockchain community and partner companies.
          </p>
        </header>

        {/* Search & Controls */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search companies or positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <span>Filters</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              {hasActiveFilters && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </button>
            
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortOrder === "newest" ? "Newest posted date" : "Oldest posted date"}</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Filter by field</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {CAREER_FIELD_OPTIONS.map((field) => (
                <button
                  key={field}
                  onClick={() => toggleCareerField(field)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    selectedFields.includes(field)
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  {CAREER_FIELD_LABELS[field]}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showReferralOnly}
                onChange={(e) => setShowReferralOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500/20"
              />
              <span className="text-xs text-zinc-400">Referral available only</span>
            </label>
          </div>
        )}

        {/* Job List */}
        <div className="space-y-0">
          {sortedJobs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500 mb-1">
                {hasActiveFilters ? "No jobs match your filters." : "No jobs available."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/50">
              {sortedJobs.map((job, index) => (
                <li key={job.id} className="py-4 group">
                  <div className="flex items-start gap-3">
                    <span className="text-zinc-600 text-sm mt-0.5 w-6 shrink-0">
                      {index + 1}.
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      {/* Title Line */}
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <a
                          href={job.job_posting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-200 hover:text-violet-300 transition-colors leading-relaxed"
                        >
                          {job.company && job.position ? (
                            <>
                              <span className="font-medium">{job.company}</span>
                              <span className="text-zinc-500"> is hiring </span>
                              <span>{job.position}</span>
                            </>
                          ) : job.company ? (
                            <span className="font-medium">{job.company}</span>
                          ) : job.position ? (
                            <span>{job.position}</span>
                          ) : (
                            <span>Job opportunity</span>
                          )}
                        </a>
                        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0 mt-1" />
                      </div>

                      {/* Meta Line */}
                      <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                        {job.experience_level && (
                          <span>{job.experience_level}</span>
                        )}
                        
                        {job.career_fields && job.career_fields.length > 0 && (
                          <>
                            {job.experience_level && <span>•</span>}
                            <span className="text-zinc-600">
                              {job.career_fields.map(f => CAREER_FIELD_LABELS[f]).join(', ')}
                            </span>
                          </>
                        )}
                        
                        <span>•</span>
                        <span>{new Date(job.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                        
                        {job.referral_available && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500/80">Referral available</span>
                          </>
                        )}
                      </div>

                      {/* Notes */}
                      {job.notes && (
                        <p className="mt-2 text-xs text-zinc-500">
                          <span className="text-zinc-600">Notes:</span> {job.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-zinc-800/50">
          <p className="text-xs text-zinc-500 text-center">
            Jobs are posted by the UW Blockchain community &lt;3 Reach to the team with questions.
          </p>
        </footer>
      </div>
    </div>
  );
}
