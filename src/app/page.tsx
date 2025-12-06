'use client';

import { useState, useEffect, useCallback } from 'react';

interface Site {
  id: string;
  subdomain: string;
  mainKeyword: string;
  status: string;
  progress: number;
  errorMsg?: string;
  createdAt: string;
  _count: {
    keywords: number;
    articles: number;
  };
}

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      setSites(data.sites || []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchSites, 5000);
    return () => clearInterval(interval);
  }, [fetchSites]);

  const createSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create site');
        return;
      }

      setNewKeyword('');
      fetchSites();
    } catch (err) {
      setError('Failed to create site');
    } finally {
      setCreating(false);
    }
  };

  const startGeneration = async (siteId: string, keywordCount: number = 50) => {
    try {
      await fetch(`/api/sites/${siteId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordCount }),
      });
      fetchSites();
    } catch (err) {
      console.error('Failed to start generation:', err);
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      await fetch(`/api/sites/${siteId}`, { method: 'DELETE' });
      fetchSites();
    } catch (err) {
      console.error('Failed to delete site:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'expanding': return 'bg-blue-500';
      case 'generating': return 'bg-yellow-500';
      case 'building': return 'bg-purple-500';
      case 'built': return 'bg-green-500';
      case 'deployed': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'expanding': return 'Expanding Keywords';
      case 'generating': return 'Generating Articles';
      case 'building': return 'Building Static Site';
      case 'built': return 'Built - Ready to Deploy';
      case 'deployed': return 'Deployed';
      case 'error': return 'Error';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                SEO Super App
              </h1>
              <p className="text-slate-400 text-sm">Generate & deploy SEO content at scale</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">
                {sites.length} site{sites.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create New Site */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Site</h2>
          <form onSubmit={createSite} className="flex gap-4">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter main keyword (e.g., coffee machines)"
              className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={creating}
            />
            <button
              type="submit"
              disabled={creating || !newKeyword.trim()}
              className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {creating ? 'Creating...' : 'Create Site'}
            </button>
          </form>
          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Sites List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading sites...</p>
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">No sites yet</h3>
            <p className="text-slate-400">Create your first site to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {site.mainKeyword}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(site.status)}`}>
                        {getStatusText(site.status)}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mb-3">
                      <span className="font-mono text-blue-400">{site.subdomain}.aksi.info</span>
                    </p>

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <span>📝 {site._count.keywords} keywords</span>
                      <span>📄 {site._count.articles} articles</span>
                      <span>📅 {new Date(site.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Progress bar */}
                    {['expanding', 'generating', 'building'].includes(site.status) && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">{getStatusText(site.status)}</span>
                          <span className="text-white font-medium">{site.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${site.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {site.errorMsg && (
                      <p className="mt-3 text-red-400 text-sm">{site.errorMsg}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {site.status === 'pending' && (
                      <>
                        <button
                          onClick={() => startGeneration(site.id, 10)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          title="Quick test with 10 keywords"
                        >
                          Test (10)
                        </button>
                        <button
                          onClick={() => startGeneration(site.id, 500)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Generate (500)
                        </button>
                      </>
                    )}

                    {['built', 'deployed'].includes(site.status) && (
                      <a
                        href={`https://${site.subdomain}.aksi.info`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Visit →
                      </a>
                    )}

                    <button
                      onClick={() => deleteSite(site.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete site"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3">How it works</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-slate-400">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <strong className="text-white">Enter Keyword</strong>
                <p>Provide a seed keyword for your niche</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <strong className="text-white">Expand Keywords</strong>
                <p>AI expands to 500 related keywords</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <strong className="text-white">Generate Articles</strong>
                <p>SEO-optimized content for each keyword</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <strong className="text-white">Deploy</strong>
                <p>Static site on your subdomain</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
