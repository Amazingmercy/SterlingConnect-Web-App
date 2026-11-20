import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Download,
  Check,
  Briefcase,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';

export const AdminBulkImportPage: React.FC = () => {
  // Correction 6: Opportunity Type selection for import
  const [selectedType, setSelectedType] = useState<'EMPLOYMENT' | 'SCHOLARSHIP'>('EMPLOYMENT');

  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [commitResult, setCommitResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewResult(null);
      setCommitResult(null);
      setError(null);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      setError('Please select a .csv or .xlsx file to validate.');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Correction 6: Pass selected opportunityType to enforce type validation
      formData.append('opportunityType', selectedType);

      const res = await api.post(
        `/admin/opportunities/bulk-import/preview?opportunityType=${selectedType}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setPreviewResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate uploaded file.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommit = async () => {
    if (!previewResult || !previewResult.validRows || previewResult.validRows.length === 0) {
      setError('There are no valid rows to import.');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      const res = await api.post('/admin/opportunities/bulk-import/commit', {
        validRows: previewResult.validRows,
      });

      setCommitResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to commit imported records.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadErrorsCsv = () => {
    if (!previewResult?.errors || previewResult.errors.length === 0) return;
    const rows = [
      ['Row Number', 'Field', 'Validation Error Message'],
      ...previewResult.errors.map((e: any) => [e.rowNumber, e.field || '', e.message]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r: any[]) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `sterling_${selectedType.toLowerCase()}_import_validation_errors.csv`;
    link.click();
  };

  const handleDownloadTemplate = async (type: 'EMPLOYMENT' | 'SCHOLARSHIP', format: 'csv' | 'xlsx') => {
    try {
      const res = await api.get(
        `/admin/opportunities/bulk-import/template?type=${type}&format=${format}`,
        { responseType: 'blob' },
      );
      const mime =
        format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8';
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sterling_${type.toLowerCase()}_opportunities_template.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback for CSV if API fails
      if (format === 'csv') {
        if (type === 'EMPLOYMENT') handleDownloadEmploymentTemplate();
        else handleDownloadScholarshipTemplate();
      }
    }
  };

  const handleDownloadEmploymentTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'opportunityType,title,organization,country,location,deadline,applicationUrl,sourceUrl,overview,requirements,workArrangement,subType,sector,function,experienceLevel,minimumEducation,skills,compensationRange',
        'EMPLOYMENT,Senior Distributed Database Engineer,Sterling Global Tech,United Kingdom,London,2027-04-30,https://sterling.example.com/apply,https://sterling.example.com/verify,Build high throughput cloud database clusters,5+ years backend systems and MySQL experience,HYBRID,Full-time,Technology & Software,Software Engineering,Senior,Bachelor,"Go, MySQL, Distributed Systems, Redis",£85000 - £100000',
        'EMPLOYMENT,Commercial Banking Associate,Sterling Financial Services,Nigeria,Lagos,2027-03-15,https://bank.example.com/careers,https://bank.example.com/announcement,Manage corporate client relationships and loan portfolios,2 years corporate banking and financial modeling,ONSITE,Full-time,Financial Services,Commercial Banking,Mid,Bachelor,"Financial Modeling, Risk Analysis, Negotiation",₦12000000 - ₦15000000',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sterling_employment_opportunities_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadScholarshipTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'opportunityType,title,organization,country,location,deadline,applicationUrl,sourceUrl,overview,requirements,fundingLevel,studyLevels,eligibleNationalities,eligibleFields,academicRequirement,experienceRequirement,languageRequirement,programStartYear',
        'SCHOLARSHIP,Sterling International Academic Fellowship,Sterling Trust,Global,Oxford,2027-05-15,https://trust.example.org/apply,https://trust.example.org/details,Fully funded postgraduate award for emerging researchers across global universities,Demonstrated leadership and academic distinction,FULLY_FUNDED,"Master\'s, PhD","All Nationalities","All Fields, STEM, Social Sciences",First Class Honours or 2:1 equivalent,2 years professional experience,IELTS 7.0 or equivalent,2027',
        'SCHOLARSHIP,Global Leadership Graduate Award,Commonwealth Academic Board,United Kingdom,London,2027-06-30,https://cw.example.org/apply,https://cw.example.org/awards,Tuition fee waiver and living stipend for Commonwealth scholars,Outstanding scholastic record and civic contribution,PARTIAL_TUITION,"Master\'s","Commonwealth Countries","Public Policy, Economics, Climate Science",3.5+ GPA or equivalent,None required,IELTS 6.5,2027',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sterling_scholarship_opportunities_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header (A07) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">
            Import opportunities
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Validate your file before importing opportunity records.
          </p>
        </div>

        {/* Template Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-blue-200 overflow-hidden shadow-xs">
            <button
              onClick={() => handleDownloadTemplate('EMPLOYMENT', 'csv')}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 transition border-r border-blue-200 cursor-pointer"
              title="Download Employment CSV Template"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-blue-700" /> Jobs .CSV
            </button>
            <button
              onClick={() => handleDownloadTemplate('EMPLOYMENT', 'xlsx')}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-100/70 hover:bg-blue-200/80 transition cursor-pointer"
              title="Download Employment Excel (.xlsx) Template"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-blue-700" /> Jobs .XLSX
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-emerald-200 overflow-hidden shadow-xs">
            <button
              onClick={() => handleDownloadTemplate('SCHOLARSHIP', 'csv')}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition border-r border-emerald-200 cursor-pointer"
              title="Download Scholarship CSV Template"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Scholarship .CSV
            </button>
            <button
              onClick={() => handleDownloadTemplate('SCHOLARSHIP', 'xlsx')}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/80 transition cursor-pointer"
              title="Download Scholarship Excel (.xlsx) Template"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Scholarship .XLSX
            </button>
          </div>
        </div>
      </div>

      {/* Target Type Selector Tabs (Correction 6: Explicitly either Scholarship or Employment) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Select Opportunity Type to Import:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedType('EMPLOYMENT');
              setPreviewResult(null);
              setCommitResult(null);
            }}
            className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
              selectedType === 'EMPLOYMENT'
                ? 'bg-blue-50/80 border-[#102641] ring-2 ring-[#102641]/20 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span
              className={`p-2 rounded-lg ${
                selectedType === 'EMPLOYMENT' ? 'bg-[#102641] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Briefcase className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900">Employment Opportunities</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Full-time jobs, graduate roles, internships, tech/corporate specifications.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedType('SCHOLARSHIP');
              setPreviewResult(null);
              setCommitResult(null);
            }}
            className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
              selectedType === 'SCHOLARSHIP'
                ? 'bg-emerald-50/80 border-emerald-800 ring-2 ring-emerald-800/20 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span
              className={`p-2 rounded-lg ${
                selectedType === 'SCHOLARSHIP' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900">Scholarship Opportunities</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Fellowships, study grants, funding levels, academic & eligibility criteria.
              </div>
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success Commitment Banner */}
      {commitResult && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Bulk Import Completed Successfully
          </div>
          <p className="text-xs">
            {commitResult.message || `${commitResult.importedCount} records added to repository.`}
          </p>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Upload {selectedType === 'EMPLOYMENT' ? 'Employment' : 'Scholarship'} Batch File (.CSV or .XLSX)
        </h3>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-800 transition bg-slate-50">
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700 mb-1">
            {file ? file.name : `Choose a CSV or Excel file containing ${selectedType.toLowerCase()} records`}
          </p>
          <p className="text-[11px] text-slate-500 mb-4">
            Supports UTF-8 CSV, XLS, and XLSX formats matching the {selectedType.toLowerCase()} template schema.
          </p>
          <label className="inline-flex items-center px-4 py-2 bg-[#102641] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer shadow-xs">
            <span>Browse Files</span>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500">
            <span>Need sample format?</span>
            <button
              type="button"
              onClick={() => handleDownloadTemplate(selectedType, 'csv')}
              className="text-[#087b63] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Download size={11} /> Download {selectedType === 'EMPLOYMENT' ? 'Jobs' : 'Scholarships'} .CSV
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleDownloadTemplate(selectedType, 'xlsx')}
              className="text-[#087b63] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet size={11} /> Download .XLSX (Excel)
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Target Type: <strong>{selectedType}</strong>
          </span>
          <button
            onClick={handleValidate}
            disabled={!file || isValidating}
            className="inline-flex items-center px-5 py-2.5 bg-[#102641] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-40 shadow-xs cursor-pointer"
          >
            {isValidating ? 'Validating schema...' : 'Validate File'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Validation Preview & Summary Banner */}
      {previewResult && (
        <div className="space-y-6">
          {/* Spec A07 Exact State Banner:
              "{valid_count} valid rows. {invalid_count} rows need attention. No invalid rows will be imported." */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              previewResult.invalidCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {previewResult.invalidCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold">
                  {previewResult.validCount} valid rows. {previewResult.invalidCount} rows need attention. No invalid rows will be imported.
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Target type: <strong>{selectedType}</strong> • Total rows in file: {previewResult.totalRows}
                </p>
              </div>
            </div>

            <button
              onClick={handleCommit}
              disabled={isCommitting || previewResult.validCount === 0}
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-40 shadow-xs flex-shrink-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              {isCommitting ? 'Importing...' : `Import ${previewResult.validCount} Valid Rows`}
            </button>
          </div>

          {/* Validation Errors Report */}
          {previewResult.errors && previewResult.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center">
                  <XCircle className="w-4 h-4 text-red-600 mr-1.5" />
                  Row Validation Issues ({previewResult.errors.length})
                </h4>
                <button
                  type="button"
                  onClick={handleDownloadErrorsCsv}
                  className="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-md transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download errors
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {previewResult.errors.map((err: any, idx: number) => (
                  <div key={idx} className="py-2 flex items-start justify-between">
                    <span className="font-mono text-slate-500 font-semibold">Row #{err.rowNumber}</span>
                    <span className="text-red-700 ml-4 font-medium">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          {previewResult.validRows && previewResult.validRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Valid Rows Ready For Import ({previewResult.validRows.length})
                </h4>
              </div>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Row #</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-4">Organization</th>
                      <th className="py-2.5 px-4">Country</th>
                      <th className="py-2.5 px-4">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewResult.validRows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-500">{row._rowNumber}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.opportunityType === 'EMPLOYMENT'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {row.opportunityType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 line-clamp-1">
                          {row.title}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{row.organization}</td>
                        <td className="py-2.5 px-4 text-slate-600">{row.country}</td>
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(row.deadline).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
