import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  BriefcaseBusiness,
  Trash2,
  PlayCircle,
  FolderOpen,
} from 'lucide-react';
import { useOpportunities } from '../../context/OpportunityContext';
import { useApplications } from '../../context/ApplicationContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const SavedOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { opportunities, savedIds, toggleSave } = useOpportunities();
  const { addOrUpdateApplication, getApplicationByOppId } = useApplications();
  const { toast } = useToast();

  // Filter opportunities to only those in savedIds
  const savedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => savedIds.includes(opp.id));
  }, [opportunities, savedIds]);

  const handleRemove = async (opportunityId: string) => {
    await toggleSave(opportunityId);
    toast('Opportunity removed from your saved list.');
  };

  const handleStartPreparing = async (opportunityId: string, title: string) => {
    await addOrUpdateApplication(
      opportunityId,
      'PREPARING',
      'Started preparing application from saved list.'
    );
    toast(`Started preparing "${title}". Added to application tracker.`);
    navigate('/applications');
  };

  const today = new Date();

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header (U19: headline & intro) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#edf0f3]">
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
            STERLING CONNECT
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
            Saved opportunities
          </h1>
          <p className="text-xs sm:text-sm text-[#627086] max-w-xl">
            Keep the opportunities you want to revisit in one place.
          </p>
        </div>

        <Link to="/opportunities">
          <Button variant="secondary" size="md">
            Browse opportunities
          </Button>
        </Link>
      </div>

      {/* Saved Opportunities List */}
      {savedOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedOpportunities.map((opp) => {
            const deadlineDate = new Date(opp.deadline);
            const diffDays = Math.ceil(
              (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const isClosed = diffDays < 0;
            const isClosingSoon = !isClosed && diffDays <= 14;
            const existingApp = getApplicationByOppId(opp.id);
            const isPreparingOrApplied =
              existingApp && existingApp.status !== 'SAVED';

            const deadlineDisplay = deadlineDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <Card
                key={opp.id}
                hoverEffect
                className="flex flex-col justify-between p-5 space-y-4 border border-[#e4eaf0] bg-white rounded-[12px] shadow-sm relative group"
              >
                <div className="space-y-3">
                  {/* Badges Row: Closed / Closing soon / Pathway */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isClosed ? (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Closed
                        </span>
                      ) : isClosingSoon ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Closing soon: {deadlineDisplay}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#627086]">
                          Deadline: {deadlineDisplay}
                        </span>
                      )}

                      {existingApp && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e3f4ed] text-[#087b63]">
                          Tracker: {existingApp.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Organization */}
                  <div>
                    <Link
                      to={`/opportunities/${opp.id}`}
                      className="font-brand font-bold text-[15px] text-[#102641] group-hover:text-[#087b63] transition-colors leading-snug line-clamp-2"
                    >
                      {opp.title}
                    </Link>
                    <p className="text-[12px] font-semibold text-[#087b63] mt-0.5">
                      {opp.organization}
                    </p>
                  </div>

                  {/* Key Tags */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-[#526078]">
                    <span className="inline-flex items-center gap-1 bg-[#f8fafb] px-2 py-0.5 rounded border border-[#e4eaf0]">
                      <MapPin size={11} className="text-[#627086]" />
                      <span>{opp.location || opp.country}</span>
                    </span>

                    {opp.opportunityType === 'SCHOLARSHIP' ? (
                      <span className="inline-flex items-center gap-1 bg-[#f8fafb] px-2 py-0.5 rounded border border-[#e4eaf0]">
                        <GraduationCap size={11} className="text-[#627086]" />
                        <span>Scholarship</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#f8fafb] px-2 py-0.5 rounded border border-[#e4eaf0]">
                        <BriefcaseBusiness size={11} className="text-[#627086]" />
                        <span>Employment</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#627086] line-clamp-2 leading-relaxed">
                    {opp.overview}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-[#edf0f3] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* U19: Start preparing -> Sets Preparing */}
                    {!isPreparingOrApplied && !isClosed ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartPreparing(opp.id, opp.title)}
                        leftIcon={<PlayCircle size={13} />}
                      >
                        Start preparing
                      </Button>
                    ) : (
                      <Link to="/applications">
                        <Button variant="secondary" size="sm">
                          View in Tracker
                        </Button>
                      </Link>
                    )}

                    <Link to={`/opportunities/${opp.id}`}>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>

                  {/* U19: Remove from saved -> Remove bookmark; keep application */}
                  <button
                    onClick={() => handleRemove(opp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded cursor-pointer"
                    title="Remove from saved"
                    aria-label="Remove from saved"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State (U19: empty & browse) */
        <div className="bg-white rounded-2xl border border-[#e4eaf0] p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#e3f4ed] text-[#087b63] flex items-center justify-center mx-auto">
            <Bookmark size={30} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#102641] font-brand">
              Saved opportunities
            </h3>
            <p className="text-xs text-[#627086] leading-relaxed">
              You haven’t saved any opportunities yet. Browse opportunities and save the ones you want to explore.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/opportunities">
              <Button variant="primary" size="md">
                Browse opportunities
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
