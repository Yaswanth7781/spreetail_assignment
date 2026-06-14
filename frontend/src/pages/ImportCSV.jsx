import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGroup } from '../api/groups';
import { uploadCSV, commitCSV } from '../api/expenses';

export default function ImportCSV() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dry run response state
  const [jobId, setJobId] = useState('');
  const [issues, setIssues] = useState([]);
  const [roommates, setRoommates] = useState([]);
  
  // Local resolutions mapping: issueId -> { resolution_selected, resolution_details, row_data_fixed }
  const [resolutions, setResolutions] = useState({});
  
  // Timeline dates: name -> { joined_date, left_date, still_active }
  const [timelineDates, setTimelineDates] = useState({
    Aisha: { joined_date: '2026-02-01', left_date: '', still_active: true },
    Rohan: { joined_date: '2026-02-01', left_date: '', still_active: true },
    Priya: { joined_date: '2026-02-01', left_date: '', still_active: true },
    Meera: { joined_date: '2026-02-01', left_date: '2026-03-31', still_active: false },
    Sam: { joined_date: '2026-04-15', left_date: '', still_active: true },
    Dev: { joined_date: '2026-05-01', left_date: '2026-05-10', still_active: false },
  });

  useEffect(() => {
    getGroup(groupId)
      .then((res) => {
        setGroup(res.data);
        // Prefill timeline with group members if they are not already listed
        const membersList = res.data.members || [];
        const newTimelines = { ...timelineDates };
        membersList.forEach((m) => {
          const name = m.user.name;
          if (!newTimelines[name]) {
            newTimelines[name] = { joined_date: '2026-02-01', left_date: '', still_active: true };
          }
        });
        setTimelineDates(newTimelines);
        setLoadingGroup(false);
      })
      .catch(() => {
        setError('Failed to fetch group details.');
        setLoadingGroup(false);
      });
  }, [groupId]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await uploadCSV(groupId, file);
      const data = res.data;
      setJobId(data.job_id);
      setIssues(data.issues);
      
      // Merge roommates returning from server
      const serverRoommates = data.roommates || [];
      setRoommates(serverRoommates);
      
      // Initialize resolutions for the loaded issues
      const initialResolutions = {};
      data.issues.forEach((issue) => {
        initialResolutions[issue.id] = {
          resolution_selected: issue.resolution_selected || 'ignore',
          resolution_details: issue.resolution_details || {},
          row_data_fixed: { ...issue.row_data },
        };
      });
      setResolutions(initialResolutions);
      setSuccess('CSV uploaded and analyzed successfully. Please review the issues below.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const handleTimelineChange = (name, field, value) => {
    setTimelineDates((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: value,
      },
    }));
  };

  const handleResolutionChange = (issueId, key, value) => {
    setResolutions((prev) => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        [key]: value,
      },
    }));
  };

  const handleResolutionDetailChange = (issueId, detailKey, value) => {
    setResolutions((prev) => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        resolution_details: {
          ...prev[issueId].resolution_details,
          [detailKey]: value,
        },
      },
    }));
  };

  const handleFixedRowDataChange = (issueId, colName, value) => {
    setResolutions((prev) => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        row_data_fixed: {
          ...prev[issueId].row_data_fixed,
          [colName]: value,
        },
      },
    }));
  };

  const handleCommit = async () => {
    setSubmitting(true);
    setError('');
    
    // Check if there are outstanding critical unresolved issues
    let hasCriticalError = false;
    issues.forEach((issue) => {
      if (issue.severity === 'critical') {
        const res = resolutions[issue.id];
        // Ensure critical fields are filled in the fixed row data
        const dateCol = Object.keys(res?.row_data_fixed || {}).find((h) => h.toLowerCase().includes('date'));
        const descCol = Object.keys(res?.row_data_fixed || {}).find((h) => h.toLowerCase().includes('desc') || h.toLowerCase().includes('title') || h.toLowerCase().includes('item') || h.toLowerCase().includes('activity'));
        const amountCol = Object.keys(res?.row_data_fixed || {}).find((h) => h.toLowerCase().includes('amount') || h.toLowerCase().includes('cost'));
        const paidByCol = Object.keys(res?.row_data_fixed || {}).find((h) => h.toLowerCase().includes('paid') || h.toLowerCase().includes('payer'));

        const dateVal = dateCol ? res.row_data_fixed[dateCol] : '';
        const descVal = descCol ? res.row_data_fixed[descCol] : '';
        const amountVal = amountCol ? res.row_data_fixed[amountCol] : '';
        const paidByVal = paidByCol ? res.row_data_fixed[paidByCol] : '';

        if (!dateVal || !descVal || !amountVal || !paidByVal) {
          hasCriticalError = true;
        }
      }
    });

    if (hasCriticalError) {
      setError('Please resolve all critical missing data errors (fill in dates, descriptions, amounts, and payers) before committing.');
      setSubmitting(false);
      return;
    }

    try {
      // Build timelines payload formatted for backend
      const customTimelineDates = {};
      Object.entries(timelineDates).forEach(([name, config]) => {
        customTimelineDates[name] = {
          joined_date: config.joined_date,
          left_date: config.still_active ? null : config.left_date,
        };
      });

      const payload = {
        job_id: jobId,
        resolutions: resolutions,
        custom_timeline_dates: customTimelineDates,
      };

      const res = await commitCSV(groupId, payload);
      setSuccess(res.data.detail || 'CSV imported successfully!');
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed. Check logs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingGroup) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-slate-500">
        Loading group data...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/groups/${groupId}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3">
          ← Back to {group?.name || 'Group'}
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Import Expenses Export CSV</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload your group's CSV expense spreadsheet. Our system will analyze the data, flag anomalies, and let you resolve duplicates, foreign currencies, negative values, and user timelines interactively.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* DROPZONE / UPLOAD PANEL */}
      {!jobId && (
        <div className="card p-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl transition-all duration-200 hover:border-brand-500">
          <form onSubmit={handleUpload} className="flex flex-col items-center justify-center text-center">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="w-full py-12 cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-3xl font-semibold mb-4 shadow-inner">
                📥
              </div>
              <p className="text-slate-700 font-semibold text-lg">
                Drag and drop your export CSV file here
              </p>
              <p className="text-slate-400 text-xs mt-1 mb-6">
                Supports standard CSV formats containing Date, Title, Payer, and Amount columns
              </p>
              <label className="btn-secondary cursor-pointer py-2 px-5 hover:border-slate-300">
                Choose CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <p className="text-brand-600 font-medium text-sm mt-4 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                  📄 Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {file && (
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary mt-4 py-2.5 px-8 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:bg-brand-700"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing CSV...
                  </>
                ) : (
                  'Analyze & Flag Anomalies'
                )}
              </button>
            )}
          </form>
        </div>
      )}

      {/* ANOMALIES & TIMELINE REVIEW PAGE */}
      {jobId && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* SECTION 1: USER ACTIVE TIMELINES */}
          <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">1. Roommate Membership Timelines</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Set active membership intervals. Roommates are excluded from splits outside their active window.
                </p>
              </div>
              <span className="bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full border border-brand-100 font-medium">
                Dynamic Timelines
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(timelineDates).map(([name, dates]) => (
                <div key={name} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                  <div className="mb-2">
                    <span className="font-semibold text-slate-800 text-sm block">{name}</span>
                    {name === 'Meera' && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
                        Left End of March
                      </span>
                    )}
                    {name === 'Sam' && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                        Joined Mid-April
                      </span>
                    )}
                    {name === 'Dev' && (
                      <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-medium">
                        Joined for US Trip
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2.5 mt-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Joined Date</label>
                      <input
                        type="date"
                        value={dates.joined_date}
                        onChange={(e) => handleTimelineChange(name, 'joined_date', e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-medium text-slate-500 block">Exit Date</label>
                        <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dates.still_active}
                            onChange={(e) => handleTimelineChange(name, 'still_active', e.target.checked)}
                            className="rounded text-brand-600 focus:ring-brand-500 scale-90"
                          />
                          Active
                        </label>
                      </div>
                      {!dates.still_active && (
                        <input
                          type="date"
                          value={dates.left_date}
                          onChange={(e) => handleTimelineChange(name, 'left_date', e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: IMPORT ANOMALIES */}
          <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">2. Review Import Anomalies & Issues</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Confirm conversions, deduplicate transactions, fix spelling errors, and correct empty columns.
                </p>
              </div>
              <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full border border-rose-100 font-medium">
                {issues.length} Issues Detected
              </span>
            </div>

            {issues.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-slate-600 font-medium text-sm">Clean CSV Data!</p>
                <p className="text-slate-400 text-xs mt-1">No anomalies detected. You can import directly.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {issues.map((issue) => {
                  const res = resolutions[issue.id] || {};
                  
                  // Helper to match column headers inside JSON row_data
                  const dateHeader = Object.keys(issue.row_data).find((h) => h.toLowerCase().includes('date'));
                  const descHeader = Object.keys(issue.row_data).find((h) => h.toLowerCase().includes('desc') || h.toLowerCase().includes('title') || h.toLowerCase().includes('item') || h.toLowerCase().includes('activity'));
                  const amountHeader = Object.keys(issue.row_data).find((h) => h.toLowerCase().includes('amount') || h.toLowerCase().includes('cost'));
                  const paidByHeader = Object.keys(issue.row_data).find((h) => h.toLowerCase().includes('paid') || h.toLowerCase().includes('payer'));

                  return (
                    <div
                      key={issue.id}
                      className={`p-5 rounded-xl border transition-all duration-150 ${
                        issue.severity === 'critical'
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Issue header info */}
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Row {issue.row_number}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                              issue.severity === 'critical'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {issue.issue_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {issue.confidence_score && (
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
                            <span className="text-[10px] text-slate-500 font-medium">Confidence Score:</span>
                            <span className="text-[10px] font-bold text-slate-700">{issue.confidence_score}%</span>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${issue.confidence_score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-slate-700 text-sm font-medium mb-3">
                        {issue.description}
                      </p>

                      {/* Raw CSV Row Details View */}
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs font-mono text-slate-600 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><strong className="text-slate-400 block text-[9px] uppercase font-sans">Date:</strong> {issue.row_data[dateHeader] || 'N/A'}</div>
                        <div><strong className="text-slate-400 block text-[9px] uppercase font-sans">Description:</strong> {issue.row_data[descHeader] || 'N/A'}</div>
                        <div><strong className="text-slate-400 block text-[9px] uppercase font-sans">Amount:</strong> {issue.row_data[amountHeader] || 'N/A'}</div>
                        <div><strong className="text-slate-400 block text-[9px] uppercase font-sans">Payer:</strong> {issue.row_data[paidByHeader] || 'N/A'}</div>
                      </div>

                      {/* RESOLUTION CONTROLS */}
                      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                        
                        {/* 1. DUPLICATE RESOLUTION */}
                        {issue.issue_type === 'duplicate' && (
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-slate-600">Action:</span>
                            <div className="flex gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`dup-res-${issue.id}`}
                                  value="ignore"
                                  checked={res.resolution_selected === 'ignore'}
                                  onChange={() => handleResolutionChange(issue.id, 'resolution_selected', 'ignore')}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                Skip Row (Deduplicate)
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`dup-res-${issue.id}`}
                                  value="import"
                                  checked={res.resolution_selected === 'import'}
                                  onChange={() => handleResolutionChange(issue.id, 'resolution_selected', 'import')}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                Import Row Anyway
                              </label>
                            </div>
                          </div>
                        )}

                        {/* 2. FOREIGN CURRENCY USD CONVERSION */}
                        {issue.issue_type === 'currency_conversion' && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-slate-600">Exchange Rate (INR/USD):</span>
                              <input
                                type="number"
                                step="0.01"
                                value={res.resolution_details?.rate || 83.50}
                                onChange={(e) => handleResolutionDetailChange(issue.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-24 border border-slate-200 rounded px-2 py-1 text-xs font-medium focus:ring-brand-500"
                              />
                              <span className="text-[11px] text-slate-400">
                                Result: ₹{(parseFloat(issue.row_data[amountHeader]?.replace(/[^\d\.]/g, '') || 0) * (res.resolution_details?.rate || 83.50)).toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="hidden"
                              value="convert"
                              ref={() => {
                                if (res.resolution_selected !== 'convert') {
                                  handleResolutionChange(issue.id, 'resolution_selected', 'convert');
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* 3. FUZZY SPELLED NAME MAPPING */}
                        {issue.issue_type === 'fuzzy_name' && (
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <span className="text-xs font-semibold text-slate-600">Mapping Decision:</span>
                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`fuzzy-res-${issue.id}`}
                                  value="map_user"
                                  checked={res.resolution_selected === 'map_user'}
                                  onChange={() => handleResolutionChange(issue.id, 'resolution_selected', 'map_user')}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                Map to existing member
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`fuzzy-res-${issue.id}`}
                                  value="add_to_group"
                                  checked={res.resolution_selected === 'add_to_group'}
                                  onChange={() => handleResolutionChange(issue.id, 'resolution_selected', 'add_to_group')}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                Add {issue.row_data[paidByHeader]} as new member
                              </label>
                            </div>
                            
                            {res.resolution_selected === 'map_user' && (
                              <select
                                value={res.resolution_details?.user_id || ''}
                                onChange={(e) => handleResolutionDetailChange(issue.id, 'user_id', e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:ring-brand-500"
                              >
                                <option value="">-- Select Member --</option>
                                {group.members?.map((m) => (
                                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {/* 4. NEGATIVE AMOUNT ACTIONS */}
                        {issue.issue_type === 'negative_amount' && (
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-slate-600">Action:</span>
                            <select
                              value={res.resolution_selected || 'refund'}
                              onChange={(e) => handleResolutionChange(issue.id, 'resolution_selected', e.target.value)}
                              className="border border-slate-200 rounded px-2.5 py-1 text-xs bg-white focus:ring-brand-500"
                            >
                              <option value="refund">Refund (split negative expense values)</option>
                              <option value="settlement">Settlement (import as direct repayment between payer/recipient)</option>
                              <option value="error">Error Correction (convert negative amount to positive)</option>
                            </select>
                          </div>
                        )}

                        {/* 5. SETTLEMENT AS EXPENSE RESOLUTION */}
                        {issue.issue_type === 'settlement_logged_as_expense' && (
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-slate-600">Import As:</span>
                            <div className="flex gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`settle-exp-${issue.id}`}
                                  value="convert_to_settlement"
                                  checked={res.resolution_selected === 'convert_to_settlement'}
                                  onChange={() => handleResolutionChange(issue.id, 'resolution_selected', 'convert_to_settlement')}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                Settlement Repayment (Recommended)
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`settle-exp-${issue.id}`}
                                  value="import"
                                  checked={res.resolution_selected === 'import'}
                                  onChange={() => handleResolutionChange(issue.id, 'resolution_selected', 'import')}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                Standard Expense Split
                              </label>
                            </div>
                          </div>
                        )}

                        {/* 6. CRITICAL MISSING DATA INLINE CORRECTION */}
                        {issue.severity === 'critical' && (
                          <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-lg space-y-3">
                            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                              ⚠️ Provide values to fix this row before import
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Date</label>
                                <input
                                  type="date"
                                  value={res.row_data_fixed?.[dateHeader] || ''}
                                  onChange={(e) => handleFixedRowDataChange(issue.id, dateHeader, e.target.value)}
                                  className="w-full border border-rose-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-rose-500 bg-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Description</label>
                                <input
                                  type="text"
                                  value={res.row_data_fixed?.[descHeader] || ''}
                                  onChange={(e) => handleFixedRowDataChange(issue.id, descHeader, e.target.value)}
                                  className="w-full border border-rose-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-rose-500 bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Amount</label>
                                <input
                                  type="text"
                                  value={res.row_data_fixed?.[amountHeader] || ''}
                                  onChange={(e) => handleFixedRowDataChange(issue.id, amountHeader, e.target.value)}
                                  className="w-full border border-rose-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-rose-500 bg-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Payer</label>
                                <select
                                  value={res.row_data_fixed?.[paidByHeader] || ''}
                                  onChange={(e) => handleFixedRowDataChange(issue.id, paidByHeader, e.target.value)}
                                  className="w-full border border-rose-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-rose-500 bg-white"
                                >
                                  <option value="">-- Select Member --</option>
                                  {group.members?.map((m) => (
                                    <option key={m.user.id} value={m.user.name}>{m.user.name}</option>
                                  ))}
                                  {/* Also let them use the CSV raw string if preferred */}
                                  {issue.row_data[paidByHeader] && (
                                    <option value={issue.row_data[paidByHeader]}>{issue.row_data[paidByHeader]} (Raw CSV value)</option>
                                  )}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTIONS ACTIONS BAR */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              onClick={() => {
                setJobId('');
                setIssues([]);
                setFile(null);
                setSuccess('');
                setError('');
              }}
              className="btn-secondary py-2.5 px-6 text-sm"
              disabled={submitting}
            >
              Back / Reset Upload
            </button>
            
            <button
              onClick={handleCommit}
              disabled={submitting}
              className="btn-primary py-2.5 px-8 text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finalizing CSV Import...
                </>
              ) : (
                'Confirm Resolutions & Import'
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
