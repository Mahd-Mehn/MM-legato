'use client';

import { useState, useEffect } from 'react';
import {
    Shield,
    CheckCircle,
    AlertTriangle,
    Clock,
    ExternalLink,
    Copy,
    Search,
    Fingerprint,
    Hash,
    Calendar,
    Eye,
    Download,
    RefreshCw,
    Link,
    FileText,
    Zap,
    Activity
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { IPProtectionData, Story } from '@/lib/types';

interface BlockchainRecord {
    id: string;
    storyId: string;
    transactionHash: string;
    blockNumber: number;
    timestamp: string;
    contentHash: string;
    authorAddress: string;
    gasUsed: number;
    status: 'confirmed' | 'pending' | 'failed';
    network: 'ethereum' | 'polygon' | 'bsc';
}

interface ForensicAnalysis {
    id: string;
    storyId: string;
    fingerprint: string;
    similarityMatches: SimilarityMatch[];
    contentAnalysis: ContentAnalysis;
    timestamp: string;
    status: 'completed' | 'processing' | 'failed';
}

interface SimilarityMatch {
    id: string;
    title: string;
    author: string;
    similarity: number;
    source: string;
    url?: string;
}

interface ContentAnalysis {
    wordCount: number;
    uniquePhrases: number;
    languagePattern: string;
    writingStyle: string;
    plagiarismScore: number;
    originalityScore: number;
}

interface BlockchainVerificationToolsProps {
    stories: Story[];
    onVerificationAction: (storyId: string, action: string) => void;
}

export default function BlockchainVerificationTools({
    stories,
    onVerificationAction
}: BlockchainVerificationToolsProps) {
    const [activeTab, setActiveTab] = useState<'verification' | 'forensics' | 'monitoring'>('verification');
    const [blockchainRecords, setBlockchainRecords] = useState<Record<string, BlockchainRecord>>({});
    const [forensicAnalyses, setForensicAnalyses] = useState<Record<string, ForensicAnalysis>>({});
    const [selectedStory, setSelectedStory] = useState<string>('');
    const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [searchHash, setSearchHash] = useState('');

    useEffect(() => {
        loadBlockchainData();
        loadForensicData();
    }, [stories]);

    const loadBlockchainData = async () => {
        // Mock blockchain data - replace with actual API calls
        const mockRecords: Record<string, BlockchainRecord> = {
            'story-1': {
                id: 'bc-1',
                storyId: 'story-1',
                transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
                blockNumber: 18500000,
                timestamp: '2024-03-15T10:30:00Z',
                contentHash: 'QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T',
                authorAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
                gasUsed: 150000,
                status: 'confirmed',
                network: 'ethereum'
            }
        };
        setBlockchainRecords(mockRecords);
    };

    const loadForensicData = async () => {
        // Mock forensic data - replace with actual API calls
        const mockAnalyses: Record<string, ForensicAnalysis> = {
            'story-1': {
                id: 'forensic-1',
                storyId: 'story-1',
                fingerprint: 'fp_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
                similarityMatches: [
                    {
                        id: 'match-1',
                        title: 'Similar Story Title',
                        author: 'Other Author',
                        similarity: 15.2,
                        source: 'Public Database',
                        url: 'https://example.com/story'
                    }
                ],
                contentAnalysis: {
                    wordCount: 85000,
                    uniquePhrases: 12500,
                    languagePattern: 'Contemporary English',
                    writingStyle: 'Narrative Fiction',
                    plagiarismScore: 2.1,
                    originalityScore: 97.9
                },
                timestamp: '2024-03-15T11:00:00Z',
                status: 'completed'
            }
        };
        setForensicAnalyses(mockAnalyses);
    };

    const handleVerifyOnBlockchain = async (storyId: string) => {
        setLoading(prev => ({ ...prev, [storyId]: true }));
        try {
            // API call to verify on blockchain
            await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
            onVerificationAction(storyId, 'verify-blockchain');
            await loadBlockchainData();
        } catch (error) {
            console.error('Blockchain verification failed:', error);
        } finally {
            setLoading(prev => ({ ...prev, [storyId]: false }));
        }
    };

    const handleRunForensicAnalysis = async (storyId: string) => {
        setLoading(prev => ({ ...prev, [`forensic-${storyId}`]: true }));
        try {
            // API call to run forensic analysis
            await new Promise(resolve => setTimeout(resolve, 3000)); // Mock delay
            onVerificationAction(storyId, 'forensic-analysis');
            await loadForensicData();
        } catch (error) {
            console.error('Forensic analysis failed:', error);
        } finally {
            setLoading(prev => ({ ...prev, [`forensic-${storyId}`]: false }));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getNetworkColor = (network: string) => {
        switch (network) {
            case 'ethereum':
                return 'text-blue-600 bg-blue-50';
            case 'polygon':
                return 'text-purple-600 bg-purple-50';
            case 'bsc':
                return 'text-yellow-600 bg-yellow-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'pending':
            case 'processing':
                return 'text-yellow-600 bg-yellow-50';
            case 'failed':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Blockchain Verification & Forensics</h1>
                    <p className="text-gray-600 mt-1">Verify authenticity and analyze content integrity</p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1 mt-4 sm:mt-0">
                    <button
                        onClick={() => setActiveTab('verification')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'verification'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Verification
                    </button>
                    <button
                        onClick={() => setActiveTab('forensics')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'forensics'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Forensics
                    </button>
                    <button
                        onClick={() => setActiveTab('monitoring')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'monitoring'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Monitoring
                    </button>
                </div>
            </div>

            {activeTab === 'verification' && (
                <div className="space-y-6">
                    {/* Blockchain Verification */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Blockchain Verification Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stories.length === 0 ? (
                                <div className="text-center py-12">
                                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No stories to verify</h3>
                                    <p className="text-gray-500">Create some stories to start blockchain verification</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stories.map((story) => {
                                        const record = blockchainRecords[story.id];
                                        const isLoading = loading[story.id];

                                        return (
                                            <div key={story.id} className="border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                            {story.title}
                                                        </h3>

                                                        {record ? (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center space-x-4">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        {record.status}
                                                                    </span>
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNetworkColor(record.network)}`}>
                                                                        {record.network}
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-gray-600">Transaction Hash:</span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => copyToClipboard(record.transactionHash)}
                                                                            >
                                                                                <Copy className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                        <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                                                                            {record.transactionHash.substring(0, 20)}...
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <span className="text-gray-600">Block Number:</span>
                                                                        <div className="font-semibold">{record.blockNumber.toLocaleString()}</div>
                                                                    </div>

                                                                    <div>
                                                                        <span className="text-gray-600">Content Hash:</span>
                                                                        <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                                                                            {record.contentHash.substring(0, 20)}...
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <span className="text-gray-600">Timestamp:</span>
                                                                        <div className="font-semibold">
                                                                            {new Date(record.timestamp).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        leftIcon={<ExternalLink className="w-4 h-4" />}
                                                                        onClick={() => window.open(`https://etherscan.io/tx/${record.transactionHash}`, '_blank')}
                                                                    >
                                                                        View on Explorer
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        leftIcon={<Download className="w-4 h-4" />}
                                                                    >
                                                                        Download Proof
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                                <div className="flex items-center">
                                                                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-yellow-800">Not Verified</h4>
                                                                        <p className="text-sm text-yellow-700">
                                                                            This story has not been verified on the blockchain yet.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="ml-6">
                                                        {record ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                leftIcon={<RefreshCw className="w-4 h-4" />}
                                                                onClick={() => handleVerifyOnBlockchain(story.id)}
                                                                disabled={isLoading}
                                                            >
                                                                Re-verify
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                leftIcon={<Shield className="w-4 h-4" />}
                                                                onClick={() => handleVerifyOnBlockchain(story.id)}
                                                                disabled={isLoading}
                                                                size="sm"
                                                            >
                                                                {isLoading ? 'Verifying...' : 'Verify on Blockchain'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'forensics' && (
                <div className="space-y-6">
                    {/* Forensic Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Forensic Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stories.length === 0 ? (
                                <div className="text-center py-12">
                                    <Fingerprint className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No stories to analyze</h3>
                                    <p className="text-gray-500">Create some stories to start forensic analysis</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stories.map((story) => {
                                        const analysis = forensicAnalyses[story.id];
                                        const isLoading = loading[`forensic-${story.id}`];

                                        return (
                                            <div key={story.id} className="border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                            {story.title}
                                                        </h3>

                                                        {analysis ? (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center space-x-4">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                                                                        <Activity className="w-3 h-3 mr-1" />
                                                                        {analysis.status}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">
                                                                        Analyzed: {new Date(analysis.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                </div>

                                                                {/* Content Analysis Results */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="text-sm font-medium text-green-900">Originality Score</h4>
                                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-green-600">
                                                                            {analysis.contentAnalysis.originalityScore}%
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="text-sm font-medium text-blue-900">Unique Phrases</h4>
                                                                            <Hash className="w-4 h-4 text-blue-600" />
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-blue-600">
                                                                            {analysis.contentAnalysis.uniquePhrases.toLocaleString()}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="text-sm font-medium text-purple-900">Plagiarism Risk</h4>
                                                                            <AlertTriangle className="w-4 h-4 text-purple-600" />
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-purple-600">
                                                                            {analysis.contentAnalysis.plagiarismScore}%
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Fingerprint */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h4 className="text-sm font-medium text-gray-900">Content Fingerprint</h4>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => copyToClipboard(analysis.fingerprint)}
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="font-mono text-xs bg-gray-50 p-3 rounded border">
                                                                        {analysis.fingerprint}
                                                                    </div>
                                                                </div>

                                                                {/* Similarity Matches */}
                                                                {analysis.similarityMatches.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Similarity Matches</h4>
                                                                        <div className="space-y-2">
                                                                            {analysis.similarityMatches.map((match) => (
                                                                                <div key={match.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div>
                                                                                            <div className="font-medium text-yellow-900">{match.title}</div>
                                                                                            <div className="text-sm text-yellow-700">by {match.author}</div>
                                                                                            <div className="text-xs text-yellow-600">{match.source}</div>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <div className="text-lg font-bold text-yellow-600">
                                                                                                {match.similarity}%
                                                                                            </div>
                                                                                            {match.url && (
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => window.open(match.url, '_blank')}
                                                                                                >
                                                                                                    <ExternalLink className="w-3 h-3" />
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        leftIcon={<Download className="w-4 h-4" />}
                                                                    >
                                                                        Download Report
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        leftIcon={<Eye className="w-4 h-4" />}
                                                                    >
                                                                        View Details
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                <div className="flex items-center">
                                                                    <Fingerprint className="w-5 h-5 text-blue-600 mr-2" />
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-blue-800">No Analysis Available</h4>
                                                                        <p className="text-sm text-blue-700">
                                                                            Run forensic analysis to check content originality and detect similarities.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="ml-6">
                                                        <Button
                                                            leftIcon={<Fingerprint className="w-4 h-4" />}
                                                            onClick={() => handleRunForensicAnalysis(story.id)}
                                                            disabled={isLoading}
                                                            size="sm"
                                                        >
                                                            {isLoading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Run Analysis'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'monitoring' && (
                <div className="space-y-6">
                    {/* Hash Search Tool */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Blockchain Hash Lookup</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex space-x-2 mb-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Enter transaction hash or content hash..."
                                        value={searchHash}
                                        onChange={(e) => setSearchHash(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <Button leftIcon={<Search className="w-4 h-4" />}>
                                    Search
                                </Button>
                            </div>

                            <div className="text-center py-8 text-gray-500">
                                <Hash className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Enter a hash to verify its authenticity and view blockchain details</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Real-time Monitoring */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Real-time Monitoring</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-green-900">Active Verifications</h4>
                                        <Zap className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">3</div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-blue-900">Pending Analyses</h4>
                                        <Clock className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600">1</div>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-purple-900">Alerts Today</h4>
                                        <AlertTriangle className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-purple-600">0</div>
                                </div>
                            </div>

                            <div className="text-center py-8 text-gray-500">
                                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Monitoring system is active and watching for suspicious activities</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}