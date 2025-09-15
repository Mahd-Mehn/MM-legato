'use client';

import { useState, useEffect } from 'react';
import { Shield, Flag, Eye, EyeOff, Trash2, Pin, Lock, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';

interface ReportedContent {
    id: string;
    type: 'topic' | 'reply';
    title: string;
    content: string;
    author: {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
    };
    reporter: {
        id: string;
        username: string;
        displayName: string;
    };
    reason: string;
    reportedAt: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ModerationAction {
    id: string;
    type: 'warn' | 'mute' | 'ban' | 'delete' | 'hide' | 'pin' | 'lock';
    targetId: string;
    targetType: 'user' | 'topic' | 'reply';
    moderatorId: string;
    reason: string;
    duration?: number; // in hours
    createdAt: string;
}

interface ModerationToolsProps {
    currentUserId: string;
    userRole: 'admin' | 'moderator' | 'user';
}

export default function ModerationTools({ currentUserId, userRole }: ModerationToolsProps) {
    const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
    const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
    const [activeTab, setActiveTab] = useState<'reports' | 'actions' | 'users'>('reports');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Only show moderation tools to admins and moderators
    if (userRole === 'user') {
        return null;
    }

    useEffect(() => {
        fetchReportedContent();
        fetchModerationActions();
    }, []);

    const fetchReportedContent = async () => {
        try {
            const response = await fetch('/api/community/moderation/reports');
            const data = await response.json();
            setReportedContent(data);
        } catch (error) {
            console.error('Failed to fetch reported content:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchModerationActions = async () => {
        try {
            const response = await fetch('/api/community/moderation/actions');
            const data = await response.json();
            setModerationActions(data);
        } catch (error) {
            console.error('Failed to fetch moderation actions:', error);
        }
    };

    const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss', reason?: string) => {
        try {
            await fetch(`/api/community/moderation/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason, moderatorId: currentUserId })
            });
            fetchReportedContent();
        } catch (error) {
            console.error('Failed to handle report:', error);
        }
    };

    const handleContentAction = async (contentId: string, contentType: string, action: string, reason: string, duration?: number) => {
        try {
            await fetch('/api/community/moderation/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetId: contentId,
                    targetType: contentType,
                    action,
                    reason,
                    duration,
                    moderatorId: currentUserId
                })
            });
            fetchModerationActions();
            fetchReportedContent();
        } catch (error) {
            console.error('Failed to perform moderation action:', error);
        }
    };

    const filteredReports = reportedContent.filter(report => {
        const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
        const matchesSearch = searchTerm === '' ||
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            case 'reviewed': return 'text-blue-600 bg-blue-50';
            case 'resolved': return 'text-green-600 bg-green-50';
            case 'dismissed': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation Tools</h1>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'reports', label: 'Reports', icon: Flag },
                        { id: 'actions', label: 'Actions', icon: Shield },
                        { id: 'users', label: 'Users', icon: Eye }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reports, users, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    {filteredReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No reports found</p>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                                                {report.severity.toUpperCase()}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {report.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(report.reportedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {report.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                            Reported by: <span className="font-medium">{report.reporter.displayName}</span>
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                            Reason: {report.reason}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <img
                                            src={report.author.avatar}
                                            alt={report.author.displayName}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                                            {report.author.displayName}
                                        </span>
                                        <span className="text-xs text-gray-500">@{report.author.username}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                        {report.content}
                                    </p>
                                </div>

                                {report.status === 'pending' && (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleContentAction(report.id, report.type, 'hide', 'Content hidden due to report')}
                                            className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm"
                                        >
                                            <EyeOff className="h-3 w-3" />
                                            Hide
                                        </button>
                                        <button
                                            onClick={() => handleContentAction(report.id, report.type, 'delete', 'Content deleted due to report')}
                                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => handleReportAction(report.id, 'dismiss', 'Report dismissed - no violation found')}
                                            className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                        >
                                            <CheckCircle className="h-3 w-3" />
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'actions' && (
                <div className="space-y-4">
                    {moderationActions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No moderation actions found</p>
                        </div>
                    ) : (
                        moderationActions.map((action) => (
                            <div key={action.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {action.type.toUpperCase()}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                on {action.targetType} {action.targetId}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {action.reason}
                                        </p>
                                        {action.duration && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Duration: {action.duration} hours
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            {new Date(action.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>User management features coming soon</p>
                    </div>
                </div>
            )}
        </div>
    );
}
