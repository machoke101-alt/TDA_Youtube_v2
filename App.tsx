import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { DashboardModal } from './components/DashboardModal';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorDisplay } from './components/ErrorDisplay';
import { GroupSettingsModal } from './components/GroupSettingsModal';
import { TopBar } from './components/TopBar';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useAppData } from './hooks/useAppData';
import { getChannelVideos, setApiKeys, validateYouTubeApiKey, setOnKeyIndexChange, setOnQuotaChange, getInitialQuota } from './services/youtubeService';
import { ChannelsView } from './components/ChannelsView';
import { GroupsOverviewModal } from './components/GroupsOverviewModal';
import { MoviesView } from './components/MoviesView';
import { VeoStudio } from './components/VeoStudio';
import { TableSkeleton, SummarySkeleton } from './components/Skeleton';
import type { ChannelStats, VideoStat, ChannelGroup, AppSettings, SortOrder } from './types';

export default function App() {
    const { session, profile, loading: authLoading, handleSignOut, updateProfile } = useSupabaseAuth();
    const appData = useAppData(session);
    const { 
        trackedChannels, channelGroups, movies, isLoading: dataLoading, error, 
        setError, isRefreshing, handleRefreshChannels, isAddingChannel, handleAddChannel, 
        handleRemoveChannel, handleAddMovies, handleUpdateMovie, handleBulkUpdateMovieStatus, 
        handleDeleteMovie, handleSaveGroup, handleDeleteGroup, setChannelGroups 
    } = appData;

    const [currentView, setCurrentView] = useState<'channels' | 'movies' | 'studio'>('channels');
    const [isViewTransitioning, setIsViewTransitioning] = useState(false);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isGroupsOverviewOpen, setIsGroupsOverviewOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ChannelGroup | null>(null);

    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [channelDashboardData, setChannelDashboardData] = useState<{ stats: ChannelStats, videos: VideoStat[] } | null>(null);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);
    const [dashboardSortOrder, setDashboardSortOrder] = useState<SortOrder>('date');

    const [settings, setSettings] = useState<AppSettings>({ refreshInterval: 0, rowsPerPage: 100 });
    const [quota, setQuota] = useState(getInitialQuota());
    const [currentKeyIndex, setCurrentKeyIndex] = useState(0);

    // Global Key Listener for API Key Selection
    useEffect(() => {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                window.aistudio?.openSelectKey?.();
            }
        });
    }, []);

    // Handle View Changes with Skeleton
    const handleViewChange = (view: 'channels' | 'movies' | 'studio') => {
        if (view === currentView) return;
        setIsViewTransitioning(true);
        setTimeout(() => {
            setCurrentView(view);
            setIsViewTransitioning(false);
        }, 300);
    };

    // YouTube API Setup
    useEffect(() => {
        if (appData.apiKeys.length > 0) {
            setApiKeys(appData.apiKeys);
            setOnQuotaChange(setQuota);
            setOnKeyIndexChange(setCurrentKeyIndex);
        }
    }, [appData.apiKeys]);

    const handleSelectChannel = async (id: string) => {
        const stats = trackedChannels.find(c => c.id === id);
        if (!stats) return;
        setSelectedChannelId(id);
        setIsDashboardLoading(true);
        try {
            const { videos } = await getChannelVideos(stats.uploadsPlaylistId, 50);
            setChannelDashboardData({ stats, videos });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDashboardLoading(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><LoadingIndicator /></div>;
    if (!session) return <Auth showCloseButton={false} />;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <TopBar 
                trackedChannelsCount={trackedChannels.length}
                apiKeys={appData.apiKeys}
                currentKeyIndex={currentKeyIndex}
                sessionQuota={quota.session}
                dailyQuota={quota.daily}
                dailyQuotaLimit={appData.apiKeys.length * 10000}
            />
            
            <Header 
                profile={profile}
                currentView={currentView === 'studio' ? 'channels' : currentView}
                onViewChange={(v) => handleViewChange(v)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenAccount={() => setIsAccountOpen(true)}
                onOpenGroupsOverview={() => setIsGroupsOverviewOpen(true)}
                onRefresh={handleRefreshChannels}
                isRefreshing={isRefreshing}
                trackedChannels={trackedChannels}
                onViewSpecificChannel={handleSelectChannel}
            />

            <div className="flex-1 container mx-auto px-4 py-8">
                {/* Secondary Navigation for Studio */}
                <div className="mb-8 flex justify-center">
                    <div className="bg-gray-800/50 p-1 rounded-2xl border border-gray-700/50 inline-flex shadow-inner">
                        <button 
                            onClick={() => handleViewChange('channels')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'channels' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Channels
                        </button>
                        <button 
                            onClick={() => handleViewChange('movies')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'movies' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Movies
                        </button>
                        <button 
                            onClick={() => handleViewChange('studio')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'studio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Veo Studio
                        </button>
                    </div>
                </div>

                <ErrorDisplay message={error} />

                {isViewTransitioning || dataLoading ? (
                    <div className="space-y-8 animate-fade-in">
                        <SummarySkeleton />
                        <TableSkeleton />
                    </div>
                ) : (
                    <>
                        {currentView === 'channels' && (
                            <ChannelsView 
                                currentSubView="allChannels"
                                trackedChannels={trackedChannels}
                                channelGroups={channelGroups}
                                onAddChannel={handleAddChannel}
                                onSelectChannel={handleSelectChannel}
                                onRemoveChannel={handleRemoveChannel}
                                onSaveGroup={handleSaveGroup}
                                onDeleteGroup={handleDeleteGroup}
                                isAdding={isAddingChannel}
                                apiKeySet={appData.apiKeys.some(k => k.status === 'valid')}
                                settings={settings}
                                setChannelGroups={setChannelGroups}
                                setEditingGroup={setEditingGroup}
                                setIsGroupModalOpen={setIsGroupModalOpen}
                            />
                        )}
                        {currentView === 'movies' && (
                            <MoviesView 
                                movies={movies}
                                channels={trackedChannels}
                                onAddMovies={handleAddMovies}
                                onUpdateMovie={handleUpdateMovie}
                                onBulkUpdateMovieStatus={handleBulkUpdateMovieStatus}
                                onDeleteMovie={handleDeleteMovie}
                                settings={settings}
                                setMovies={() => {}} // Hook handles state
                            />
                        )}
                        {currentView === 'studio' && <VeoStudio />}
                    </>
                )}
            </div>

            <Footer />

            {/* Modals */}
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                apiKeys={appData.apiKeys}
                onApiKeysChange={(keys) => {}} // Implemented in useAppData but exposed differently
                onRevalidateAll={() => {}}
                settings={settings}
                onSettingsChange={setSettings}
            />

            <AccountSettingsModal 
                isOpen={isAccountOpen}
                onClose={() => setIsAccountOpen(false)}
                profile={profile}
                onUpdateProfile={updateProfile}
                onSignOut={handleSignOut}
            />

            <GroupsOverviewModal 
                isOpen={isGroupsOverviewOpen}
                onClose={() => setIsGroupsOverviewOpen(false)}
                groups={channelGroups}
                channels={trackedChannels}
                onEditGroup={(g) => { setEditingGroup(g); setIsGroupModalOpen(true); }}
                onDeleteGroup={handleDeleteGroup}
                onCreateGroup={() => { setEditingGroup(null); setIsGroupModalOpen(true); }}
                settings={settings}
            />

            <GroupSettingsModal 
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                existingGroup={editingGroup}
                allChannels={trackedChannels}
                onSave={handleSaveGroup}
            />

            {selectedChannelId && channelDashboardData && (
                <DashboardModal 
                    isOpen={!!selectedChannelId}
                    onClose={() => setSelectedChannelId(null)}
                    channelStats={channelDashboardData.stats}
                    initialVideos={channelDashboardData.videos}
                    isLoading={isDashboardLoading}
                    allChannels={trackedChannels}
                    channelGroups={channelGroups}
                    recentlyViewedIds={[]}
                    onSwitchChannel={handleSelectChannel}
                    sortOrder={dashboardSortOrder}
                    onSortOrderChange={setDashboardSortOrder}
                />
            )}
        </div>
    );
}