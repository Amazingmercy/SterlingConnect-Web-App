import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  ArrowRight,
  SlidersHorizontal,
  CheckCheck,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '../../context/NotificationContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount, refreshNotifications } = useNotifications();
  const [filterTab, setFilterTab] = useState<'unread' | 'all'>(() => (unreadCount > 0 ? 'unread' : 'all'));

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'unread') return !item.read;
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'deadline':
        return <Calendar size={18} className="text-amber-600" />;
      case 'result':
        return <Award size={18} className="text-[#087b63]" />;
      case 'followup':
        return <Clock size={18} className="text-blue-600" />;
      default:
        return <Bell size={18} className="text-[#627086]" />;
    }
  };

  const getBadgeStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'result':
        return 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]';
      case 'followup':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Page Header (Exact Copy: "Your notifications") */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#edf0f3]">
        <div className="space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
            Notifications centre
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
            Your notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#627086]">
            Keep track of upcoming deadlines, readiness score updates, and application follow-ups.
          </p>
        </div>

        {/* Link: Manage notification preferences */}
        <Link to="/settings" className="self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<SlidersHorizontal size={13} />}
          >
            Manage notification preferences
          </Button>
        </Link>
      </div>

      {/* Filter Bar: Unread | All notifications */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('unread')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'unread'
                ? 'bg-[#102641] text-white shadow-xs'
                : 'bg-white text-[#526078] border border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#087b63] text-white font-extrabold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#102641] text-white shadow-xs'
                : 'bg-white text-[#526078] border border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            <span>All notifications</span>
            <span className="ml-1.5 text-[11px] opacity-70">({notifications.length})</span>
          </button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck size={14} />}
            className="text-xs text-[#087b63] hover:bg-[#e3f4ed]/50 font-bold"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <Card
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !item.read
                  ? 'bg-white border-[#c9dfd6] shadow-sm ring-1 ring-[#087b63]/10'
                  : 'bg-[#fafbfc] border-[#e4eaf0] opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                {/* Icon Circle */}
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getBadgeStyle(
                        item.type
                      )}`}
                    >
                      {item.title}
                    </span>
                    {!item.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-[#087b63]" />
                    )}
                    <span className="text-[11px] text-[#627086]">{formatTimeAgo(item.date)}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-[#102641] leading-snug">
                    {item.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {item.actionUrl && (
                  <Link to={item.actionUrl}>
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight size={12} />}
                      onClick={() => markAsRead(item.id)}
                    >
                      {item.actionLabel || 'View'}
                    </Button>
                  </Link>
                )}

                {!item.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(item.id)}
                    className="text-xs text-[#526078] hover:text-[#102641]"
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State (Exact Copy: "You’re all caught up. New reminders and updates will appear here.") */
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e4eaf0] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#e3f4ed] text-[#087b63] mx-auto flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-brand font-extrabold text-base text-[#102641]">
              You’re all caught up
            </h3>
            <p className="text-xs sm:text-sm text-[#627086] max-w-md mx-auto leading-relaxed">
              You’re all caught up. New reminders and updates will appear here.
            </p>
          </div>
          {notifications.length > 0 && filterTab === 'unread' && (
            <div className="pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilterTab('all')}
              >
                View all past notifications ({notifications.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
