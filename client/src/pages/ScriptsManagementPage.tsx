import React, { useState, useEffect } from 'react';
import { Database, Play, PlaySquare, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ScriptInfo, GetScriptsStatusResponse, RunScriptResponse, RunAllScriptsResponse } from '@timothyw/ems-scraper-types';

interface ScriptWithStatus extends ScriptInfo {
    isRunning: boolean;
    lastResult?: RunScriptResponse;
}

export const ScriptsManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [scripts, setScripts] = useState<ScriptWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunningAll, setIsRunningAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchScripts = async () => {
        try {
            setError(null);
            const response = await fetch('/api/admin/scripts/status', {
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                const result = data.data as GetScriptsStatusResponse;
                setScripts(result.scripts.map(script => ({
                    ...script,
                    isRunning: false
                })));
                setLastUpdate(new Date());
            } else {
                setError(data.error?.message || 'Failed to fetch scripts');
            }
        } catch (err) {
            setError('Failed to fetch scripts');
            console.error('Error fetching scripts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const makeApiRequest = async (url: string, method: 'GET' | 'POST' = 'GET') => {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${user?.token}`,
                'Content-Type': 'application/json',
            },
        });
        return await response.json();
    };

    const setScriptRunning = (scriptName: string | null, isRunning: boolean) => {
        if (scriptName) {
            // Update specific script
            setScripts(prev => prev.map(s => 
                s.name === scriptName ? { ...s, isRunning, lastResult: undefined } : s
            ));
        } else {
            // Update all scripts
            setScripts(prev => prev.map(s => ({ ...s, isRunning, lastResult: undefined })));
        }
    };

    const setScriptResult = (results: RunScriptResponse | RunScriptResponse[]) => {
        if (Array.isArray(results)) {
            // Handle multiple results (from run all)
            setScripts(prev => prev.map(script => {
                const scriptResult = results.find(r => r.scriptName === script.name);
                return {
                    ...script,
                    isRunning: false,
                    lastResult: scriptResult
                };
            }));
        } else {
            // Handle single result
            setScripts(prev => prev.map(s => 
                s.name === results.scriptName ? { ...s, isRunning: false, lastResult: results } : s
            ));
        }
    };

    const setScriptError = (scriptName: string | null, message: string) => {
        const errorResult: RunScriptResponse = {
            success: false,
            scriptName: scriptName || 'unknown',
            message
        };

        if (scriptName) {
            // Update specific script
            setScripts(prev => prev.map(s => 
                s.name === scriptName ? { ...s, isRunning: false, lastResult: errorResult } : s
            ));
        } else {
            // Update all scripts
            setScripts(prev => prev.map(s => ({ 
                ...s, 
                isRunning: false, 
                lastResult: { ...errorResult, scriptName: s.name }
            })));
        }
    };

    const runScript = async (scriptName: string) => {
        setScriptRunning(scriptName, true);

        try {
            const data = await makeApiRequest(`/api/admin/scripts/run/${scriptName}`, 'POST');

            if (data.success) {
                const result = data.data as RunScriptResponse;
                setScriptResult(result);
                
                // Refresh after delay to show success message
                setTimeout(async () => {
                    await fetchScripts();
                }, 2000);
            } else {
                setScriptError(scriptName, data.error?.message || 'Failed to run script');
            }
        } catch (err) {
            setScriptError(scriptName, 'Network error');
            console.error('Error running script:', err);
        }
    };

    const runAllScripts = async () => {
        setIsRunningAll(true);
        setScriptRunning(null, true);

        try {
            const data = await makeApiRequest('/api/admin/scripts/run-all', 'POST');

            if (data.success) {
                const result = data.data as RunAllScriptsResponse;
                setScriptResult(result.results);

                // Refresh after delay to show success messages
                setTimeout(async () => {
                    await fetchScripts();
                }, 3000);
            } else {
                setScriptError(null, data.error?.message || 'Failed to run scripts');
            }
        } catch (err) {
            setScriptError(null, 'Network error');
            console.error('Error running all scripts:', err);
        } finally {
            setIsRunningAll(false);
        }
    };

    useEffect(() => {
        fetchScripts();
    }, []);

    const getStatusColor = (status: 'empty' | 'populated') => {
        return status === 'empty' ? 'text-yellow-400' : 'text-green-400';
    };

    const getStatusIcon = (status: 'empty' | 'populated') => {
        return status === 'empty' ? AlertCircle : CheckCircle;
    };

    const formatScriptName = (name: string) => {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Database className="w-8 h-8 text-blue-400" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Scripts Management</h1>
                            <p className="text-gray-400">Control population scripts and monitor table status</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchScripts}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        
                        <button
                            onClick={runAllScripts}
                            disabled={isRunningAll || scripts.some(s => s.isRunning)}
                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <PlaySquare className="w-4 h-4" />
                            <span>{isRunningAll ? 'Running All Scripts...' : 'Run All Scripts'}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-300">{error}</span>
                        </div>
                    </div>
                )}

                <div className="mb-6 text-sm text-gray-400">
                    Last updated: {lastUpdate.toLocaleString()}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                        <span className="ml-3 text-gray-300">Loading scripts...</span>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {scripts.map((script) => {
                            const StatusIcon = getStatusIcon(script.status);
                            
                            return (
                                <div
                                    key={script.name}
                                    className="bg-gray-800 rounded-lg border border-gray-700 p-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-3">
                                                <Database className="w-6 h-6 text-gray-400" />
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {formatScriptName(script.name)}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">
                                                        Table: {script.tableName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center space-x-2">
                                                <StatusIcon className={`w-5 h-5 ${getStatusColor(script.status)}`} />
                                                <span className={`font-medium ${getStatusColor(script.status)}`}>
                                                    {script.recordCount} records
                                                </span>
                                                <span className="text-gray-500">
                                                    ({script.status})
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => runScript(script.name)}
                                                disabled={script.isRunning || isRunningAll}
                                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {script.isRunning ? (
                                                    <>
                                                        <Clock className="w-4 h-4 animate-pulse" />
                                                        <span>Running...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4" />
                                                        <span>Run Script</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {script.lastResult && (
                                        <div className="mt-4 p-3 rounded-md bg-gray-700">
                                            <div className="flex items-center space-x-2">
                                                {script.lastResult.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className={`text-sm ${script.lastResult.success ? 'text-green-300' : 'text-red-300'}`}>
                                                    {script.lastResult.message}
                                                </span>
                                                {script.lastResult.success && script.lastResult.recordsProcessed !== undefined && (
                                                    <span className="text-gray-400 text-sm">
                                                        ({script.lastResult.recordsProcessed} records processed)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};