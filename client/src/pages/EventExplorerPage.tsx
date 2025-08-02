import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../stores/uiStore';
import { Search, Calendar, Clock, MapPin, Users, History, ChevronDown, ChevronRight, AlertTriangle, Activity, Eye, Database, Copy, ExternalLink } from 'lucide-react';

interface EventDetails {
  id: string;
  event_name: string;
  event_start: string;
  event_end: string;
  gmt_start: string;
  gmt_end: string;
  time_booking_start: string;
  time_booking_end: string;
  is_all_day_event: boolean;
  timezone_abbreviation: string;
  building: string;
  building_id: string;
  room: string;
  room_id: string;
  room_code: string;
  room_type: string;
  room_type_id: string;
  location: string;
  location_link: string;
  group_name: string;
  reservation_id: string;
  reservation_summary_url: string;
  status_id: string;
  status_type_id: string;
  web_user_is_owner: boolean;
  no_longer_found_at?: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  last_checked: string;
}

interface HistoryEntry {
  version_number: number;
  change_count: number;
  archived_at: string;
  event_name: string;
  event_start: string;
  event_end: string;
  gmt_start: string;
  gmt_end: string;
  time_booking_start: string;
  time_booking_end: string;
  is_all_day_event: boolean;
  timezone_abbreviation: string;
  building: string;
  building_id: string;
  room: string;
  room_id: string;
  room_code: string;
  room_type: string;
  room_type_id: string;
  location: string;
  location_link: string;
  group_name: string;
  reservation_id: string;
  reservation_summary_url: string;
  status_id: string;
  status_type_id: string;
  web_user_is_owner: boolean;
}

interface EventDetailsResponse {
  success: boolean;
  data?: {
    event: EventDetails;
  };
  error?: {
    message: string;
    code: string;
  };
}

interface EventHistoryResponse {
  success: boolean;
  data?: {
    eventId: string;
    historyCount: number;
    history: HistoryEntry[];
  };
  error?: {
    message: string;
    code: string;
  };
}

interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
}

export const EventExplorerPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [eventHistory, setEventHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // UI state from Zustand store
  const {
    eventExplorer: { showRawDetails, expandedVersions, expandedRawVersions, expandedFieldValues },
    toggleRawDetails,
    toggleVersionExpansion,
    toggleRawVersionExpansion,
    toggleFieldValueExpansion,
    resetEventExplorerState
  } = useUIStore();

  const searchEvent = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setEventDetails(null);
    setEventHistory([]);

    try {
      const response = await fetch(`/api/events/${searchTerm}/details`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      const result: EventDetailsResponse = await response.json();
      
      if (result.success && result.data) {
        setEventDetails(result.data.event);
        // Automatically fetch history
        await fetchEventHistory(searchTerm);
      } else {
        setError(result.error?.message || 'Event not found');
      }
    } catch (error) {
      setError('Network error');
      console.error('Failed to fetch event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventHistory = async (eventId: string) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/history`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      
      const result: EventHistoryResponse = await response.json();
      
      if (result.success && result.data) {
        setEventHistory(result.data.history);
      } else {
        setHistoryError(result.error?.message || 'Failed to fetch history');
      }
    } catch (error) {
      setHistoryError('Network error');
      console.error('Failed to fetch event history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Reset state when searching for a new event
  const handleSearch = async () => {
    resetEventExplorerState();
    await searchEvent();
  };

  const calculateDiff = (oldEntry: HistoryEntry | EventDetails, newEntry: HistoryEntry | EventDetails): FieldDiff[] => {
    const diffs: FieldDiff[] = [];
    // Match the server-side field comparison from EventModel.detectChanges
    const fieldsToCompare = [
      'event_name', 'event_start', 'event_end', 'gmt_start', 'gmt_end',
      'time_booking_start', 'time_booking_end', 'is_all_day_event', 'timezone_abbreviation',
      'building', 'building_id', 'room', 'room_id', 'room_code', 'room_type', 'room_type_id',
      'location', 'location_link', 'group_name', 'reservation_id', 'reservation_summary_url',
      'status_id', 'status_type_id', 'web_user_is_owner'
    ];

    for (const field of fieldsToCompare) {
      const oldValue = (oldEntry as any)[field];
      const newValue = (newEntry as any)[field];
      
      if (oldValue !== newValue) {
        diffs.push({ field, oldValue, newValue });
      }
    }

    return diffs;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };

    return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
  };

  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }
    return <span>{String(value)}</span>;
  };

  const SmartFieldValue: React.FC<{ value: any; fieldKey: string; uniqueId: string }> = ({ value, fieldKey, uniqueId }) => {
    const isExpanded = expandedFieldValues.has(uniqueId);
    
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }
    
    const stringValue = String(value);
    const isLong = stringValue.length > 50;
    const isUrl = stringValue.startsWith('http') || stringValue.includes('.aspx');
    const isBooleanString = stringValue === 'true' || stringValue === 'false';
    
    const copyToClipboard = () => {
      navigator.clipboard.writeText(stringValue);
    };
    
    const openUrl = () => {
      if (isUrl && stringValue.startsWith('http')) {
        window.open(stringValue, '_blank');
      }
    };
    
    if (!isLong) {
      return (
        <div className="flex items-center space-x-1">
          <span className={`font-mono ${isBooleanString ? 'text-blue-300' : 'text-gray-200'}`}>
            {stringValue}
          </span>
          {stringValue.length > 10 && (
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}
          {isUrl && stringValue.startsWith('http') && (
            <button
              onClick={openUrl}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Open URL"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    }
    
    // Long value handling
    const truncated = stringValue.substring(0, 50) + '...';
    
    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <span className="font-mono text-gray-200">
            {isExpanded ? stringValue : truncated}
          </span>
          <button
            onClick={() => toggleFieldValueExpansion(uniqueId)}
            className="text-blue-400 hover:text-blue-300 transition-colors text-xs cursor-pointer"
            title={isExpanded ? 'Show less' : 'Show full value'}
          >
            {isExpanded ? 'less' : 'more'}
          </button>
        </div>
        {isExpanded && (
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center space-x-1"
              title="Copy full value to clipboard"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
            {isUrl && stringValue.startsWith('http') && (
              <button
                onClick={openUrl}
                className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center space-x-1"
                title="Open URL"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRawDetails = (data: EventDetails | HistoryEntry) => {
    const baseId = 'created_at' in data ? `current-${data.id}` : `history-${data.version_number}`;
    
    const fields = [
      // Core event info
      { key: 'id', label: 'Event ID', group: 'Core' },
      { key: 'event_name', label: 'Event Name', group: 'Core' },
      
      // Time fields
      { key: 'event_start', label: 'Event Start', group: 'Time' },
      { key: 'event_end', label: 'Event End', group: 'Time' },
      { key: 'gmt_start', label: 'GMT Start', group: 'Time' },
      { key: 'gmt_end', label: 'GMT End', group: 'Time' },
      { key: 'time_booking_start', label: 'Booking Start', group: 'Time' },
      { key: 'time_booking_end', label: 'Booking End', group: 'Time' },
      { key: 'is_all_day_event', label: 'All Day Event', group: 'Time' },
      { key: 'timezone_abbreviation', label: 'Timezone', group: 'Time' },
      
      // Location fields
      { key: 'building', label: 'Building', group: 'Location' },
      { key: 'building_id', label: 'Building ID', group: 'Location' },
      { key: 'room', label: 'Room', group: 'Location' },
      { key: 'room_id', label: 'Room ID', group: 'Location' },
      { key: 'room_code', label: 'Room Code', group: 'Location' },
      { key: 'room_type', label: 'Room Type', group: 'Location' },
      { key: 'room_type_id', label: 'Room Type ID', group: 'Location' },
      { key: 'location', label: 'Location', group: 'Location' },
      { key: 'location_link', label: 'Location Link', group: 'Location' },
      
      // Group and reservation
      { key: 'group_name', label: 'Group Name', group: 'Organization' },
      { key: 'reservation_id', label: 'Reservation ID', group: 'Organization' },
      { key: 'reservation_summary_url', label: 'Reservation URL', group: 'Organization' },
      
      // Status fields
      { key: 'status_id', label: 'Status ID', group: 'Status' },
      { key: 'status_type_id', label: 'Status Type ID', group: 'Status' },
      { key: 'web_user_is_owner', label: 'Web User Is Owner', group: 'Status' },
    ];

    // Add metadata fields
    fields.unshift({ key: 'version_number', label: 'Version Number', group: 'Metadata' });
    
    // Add metadata fields for current event
    if ('created_at' in data) {
      fields.push(
        { key: 'created_at', label: 'Created At', group: 'Metadata' },
        { key: 'updated_at', label: 'Updated At', group: 'Metadata' },
        { key: 'last_checked', label: 'Last Checked', group: 'Metadata' },
        { key: 'no_longer_found_at', label: 'No Longer Found At', group: 'Metadata' }
      );
    }

    // Add history metadata for history entries
    if ('archived_at' in data) {
      fields.push(
        { key: 'archived_at', label: 'Archived At', group: 'Metadata' },
        { key: 'change_count', label: 'Change Count', group: 'Metadata' }
      );
    }

    const groupedFields = fields.reduce((groups, field) => {
      if (!groups[field.group]) groups[field.group] = [];
      groups[field.group].push(field);
      return groups;
    }, {} as Record<string, typeof fields>);

    // Separate metadata from other groups
    const metadataFields = groupedFields['Metadata'] || [];
    const otherGroups = Object.entries(groupedFields).filter(([group]) => group !== 'Metadata');
    
    return (
      <div className="space-y-4">
        {/* Metadata Section - Always at top with distinct styling */}
        {metadataFields.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
            <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
              <Database className="w-4 h-4 mr-1" />
              Metadata
            </h5>
            <div className="space-y-1">
              {metadataFields.map(field => (
                <div key={field.key} className="flex items-start space-x-2 text-xs">
                  <span className="text-gray-400 font-medium min-w-0 flex-shrink-0" style={{width: '120px'}}>
                    {field.label}:
                  </span>
                  <div className="min-w-0 flex-1">
                    <SmartFieldValue 
                      value={(data as any)[field.key]} 
                      fieldKey={field.key}
                      uniqueId={`${baseId}-${field.key}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Other Groups - Responsive grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {otherGroups.map(([group, groupFields]) => (
            <div key={group} className="bg-gray-700 rounded p-3">
              <h5 className="text-sm font-medium text-gray-300 mb-2">{group}</h5>
              <div className="space-y-1">
                {groupFields.map(field => (
                  <div key={field.key} className="flex items-start space-x-2 text-xs">
                    <span className="text-gray-400 font-medium min-w-0 flex-shrink-0" style={{width: '120px'}}>
                      {field.label}:
                    </span>
                    <div className="min-w-0 flex-1">
                      <SmartFieldValue 
                        value={(data as any)[field.key]} 
                        fieldKey={field.key}
                        uniqueId={`${baseId}-${field.key}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Event Explorer</h2>
        <div className="text-xs text-gray-400">
          Search by Event ID to view details and history
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter Event ID (e.g., 12345)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchTerm.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Event Details Section */}
      {eventDetails && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-400" />
            Event Details (Current Version {eventDetails.version_number})
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Event Name</label>
                <p className="text-white">{eventDetails.event_name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Time</label>
                <p className="text-white flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {formatEventTime(eventDetails.event_start, eventDetails.event_end)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Location</label>
                <p className="text-white flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {eventDetails.building} - {eventDetails.room}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Group</label>
                <p className="text-white flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  {eventDetails.group_name}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Status</label>
                <p className="text-white">
                  {eventDetails.no_longer_found_at ? (
                    <span className="text-orange-400 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      No longer found ({formatDateTime(eventDetails.no_longer_found_at)})
                    </span>
                  ) : (
                    <span className="text-green-400">Active</span>
                  )}
                </p>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>Created: {formatDateTime(eventDetails.created_at)}</p>
                <p>Updated: {formatDateTime(eventDetails.updated_at)}</p>
                <p>Last Checked: {formatDateTime(eventDetails.last_checked)}</p>
              </div>
            </div>
          </div>
          
          {/* Raw Details Section */}
          <div className="mt-6 border-t border-gray-700 pt-4">
            <button
              onClick={toggleRawDetails}
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showRawDetails ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Database className="w-4 h-4" />
              <span>Raw Details ({Object.keys(eventDetails).length} fields)</span>
            </button>
            
            {showRawDetails && (
              <div className="mt-4">
                {renderRawDetails(eventDetails)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event History Section */}
      {eventDetails && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <History className="w-5 h-5 mr-2 text-purple-400" />
            Event History ({eventHistory.length} versions)
          </h3>
          
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-300">Loading history...</span>
            </div>
          ) : historyError ? (
            <div className="text-red-400 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {historyError}
            </div>
          ) : eventHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>No historical versions found</p>
              <p className="text-sm mt-2">This event has not been modified since creation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventHistory.map((historyEntry, index) => {
                const isExpanded = expandedVersions.has(historyEntry.version_number);
                const nextEntry = index === 0 ? eventDetails : eventHistory[index - 1];
                const diffs = calculateDiff(historyEntry, nextEntry);
                
                return (
                  <div key={historyEntry.version_number} className="border border-gray-600 rounded-lg">
                    <button
                      onClick={() => toggleVersionExpansion(historyEntry.version_number)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-white font-medium">
                          Version {historyEntry.version_number}
                        </span>
                        <span className="text-sm text-gray-400">
                          {historyEntry.change_count} change{historyEntry.change_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(historyEntry.archived_at)}
                        </span>
                      </div>
                      <div className="text-sm text-purple-400">
                        {diffs.length} diff{diffs.length !== 1 ? 's' : ''}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-600">
                        {diffs.length > 0 ? (
                          <div className="space-y-3 mt-3">
                            <h4 className="text-sm font-medium text-gray-300">Changes:</h4>
                            {diffs.map((diff, diffIndex) => (
                              <div key={diffIndex} className="bg-gray-700 rounded p-3">
                                <div className="text-sm font-medium text-gray-300 mb-2">
                                  {diff.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <span className="text-red-400 mr-2">-</span>
                                    <span className="text-red-300">{renderFieldValue(diff.oldValue)}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <span className="text-green-400 mr-2">+</span>
                                    <span className="text-green-300">{renderFieldValue(diff.newValue)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 mt-3">
                            No changes detected between this version and the next.
                          </div>
                        )}
                        
                        {/* Raw Details for History Version */}
                        <div className="mt-4 border-t border-gray-600 pt-3">
                          <button
                            onClick={() => toggleRawVersionExpansion(historyEntry.version_number)}
                            className="flex items-center space-x-2 text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                          >
                            {expandedRawVersions.has(historyEntry.version_number) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <Database className="w-3 h-3" />
                            <span>Raw Details (Version {historyEntry.version_number})</span>
                          </button>
                          
                          {expandedRawVersions.has(historyEntry.version_number) && (
                            <div className="mt-3">
                              {renderRawDetails(historyEntry)}
                            </div>
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
      )}
    </div>
  );
};