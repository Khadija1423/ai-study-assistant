import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../../../shared';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    Layers,
    CheckCircle2,
    Calendar,
    MessageSquare,
    Play,
    Zap,
    Clock,
    BookOpen
} from 'lucide-react';

interface DashboardProps {
    onNavigate: (tab: string, documentId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const res = await fetch(`${apiUrl}/dashboard`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading || !stats) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
            </div>
        );
    }

    const userName = 'Student'; // Placeholder

    // Calculate exam countdown
    let examDaysAway: number | null = null;
    if (stats.activeStudyPlan) {
        const examDate = new Date(stats.activeStudyPlan.examDate);
        const today = new Date();
        const diffTime = examDate.getTime() - today.getTime();
        examDaysAway = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {userName}</h1>
                    <p className="text-muted-foreground">Here is what's happening with your studies today.</p>
                </div>
            </div>

            {/* Stats Row */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h3 className="font-medium text-muted-foreground text-sm">Documents</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.totalDocuments}</div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Layers size={20} />
                        </div>
                        <h3 className="font-medium text-muted-foreground text-sm">Flashcards</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.totalFlashcards}</div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                            <BookOpen size={20} />
                        </div>
                        <h3 className="font-medium text-muted-foreground text-sm">Quizzes Taken</h3>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stats.totalQuizzes}</div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className="font-medium text-muted-foreground text-sm">Avg Score</h3>
                    </div>
                    <div className="flex items-end gap-1">
                        <div className="text-3xl font-bold text-foreground">{stats.averageQuizScore}</div>
                        <div className="text-muted-foreground mb-1">%</div>
                    </div>
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area - Continue Studying */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Zap className="text-primary" /> Continue Studying
                    </h2>

                    {stats.recentDocuments.length === 0 ? (
                        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm">
                            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">No documents yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Upload your first document to start generating summaries, flashcards, and quizzes.
                            </p>
                            <button
                                onClick={() => onNavigate('documents')}
                                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                            >
                                Upload Document
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentDocuments.map((doc: any, idx: number) => (
                                <motion.div
                                    key={doc._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4 overflow-hidden">
                                        <div className="p-3 bg-secondary rounded-lg shrink-0 mt-1 sm:mt-0">
                                            <FileText className="text-primary" size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-foreground text-lg truncate">
                                                {doc.originalFilename}
                                            </h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Clock size={14} />
                                                Added {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                                        <button
                                            onClick={() => onNavigate('documents', doc._id)}
                                            className="p-2.5 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors flex items-center gap-2 text-sm font-medium group"
                                            title="View Document & Chat"
                                        >
                                            <MessageSquare size={16} />
                                            <span className="hidden sm:inline">Chat</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Quick jump to flashcards setup for this doc
                                                onNavigate('flashcards', doc._id);
                                            }}
                                            className="p-2.5 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors flex items-center gap-2 text-sm font-medium group"
                                            title="Study Flashcards"
                                        >
                                            <Layers size={16} />
                                            <span className="hidden sm:inline">Flashcards</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Quick jump to quiz for this doc
                                                onNavigate('quiz');
                                            }}
                                            className="p-2.5 bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors flex items-center gap-2 text-sm font-medium group"
                                            title="Take Quiz"
                                        >
                                            <Play size={16} />
                                            <span className="hidden sm:inline">Quiz</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Calendar className="text-primary" /> Active Plan
                    </h2>

                    {stats.activeStudyPlan ? (
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-background border border-primary/20 rounded-xl p-6 shadow-sm relative overflow-hidden">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Calendar size={100} />
                            </div>

                            <div className="relative z-10">
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Target Exam</h3>
                                    <p className="text-2xl font-bold text-foreground">{new Date(stats.activeStudyPlan.examDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>

                                {examDaysAway !== null && (
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <div className="text-5xl font-black text-primary">
                                            {examDaysAway > 0 ? examDaysAway : 0}
                                        </div>
                                        <div className="text-lg font-medium text-muted-foreground pb-1">
                                            {examDaysAway === 1 ? 'day left' : 'days left'}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => onNavigate('studyPlan')}
                                    className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    View Today's Tasks
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
                            <div className="mx-auto w-12 h-12 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
                                <Calendar size={24} />
                            </div>
                            <h3 className="font-bold mb-2">No Active Plan</h3>
                            <p className="text-sm text-muted-foreground mb-4">Set up a study plan to map out your preparation leading up to exam day.</p>
                            <button
                                onClick={() => onNavigate('studyPlan')}
                                className="w-full py-2 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                                Create Study Plan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
