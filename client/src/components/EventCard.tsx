import React from 'react';
import { Clock, MapPin } from 'lucide-react';

interface EventCardProps {
  eventId: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  building: string;
  room: string;
  groupName?: string;
  statusLine: string; // For the blue/orange status line (time ago or change info)
  statusColor: 'blue' | 'orange' | 'purple';
  onClick?: (eventId: string) => void;
  bottomLine?: string; // Optional bottom line for additional info
}

export const EventCard: React.FC<EventCardProps> = ({
  eventId,
  eventName,
  eventStart,
  eventEnd,
  building,
  room,
  groupName,
  statusLine,
  statusColor,
  onClick,
  bottomLine
}) => {
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
        day: 'numeric'
      });
    };

    return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(eventId);
    }
  };

  const statusColorClass = {
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400'
  }[statusColor];

  return (
    <div
      onClick={handleClick}
      className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-white text-sm leading-tight flex-1">
          {eventName}
        </h4>
        <span className={`text-xs font-medium ml-2 flex-shrink-0 ${statusColorClass}`}>
          {statusLine}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-gray-300">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1 text-gray-400" />
          {formatEventTime(eventStart, eventEnd)}
        </div>
        
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
          {building} - {room}
        </div>
        
        {groupName && (
          <div className="text-gray-400">
            Group: {groupName}
          </div>
        )}
      </div>
      
      <div className="mt-2 flex justify-between items-end">
        <div className="text-xs text-gray-500">
          Event ID: {eventId}
        </div>
        {bottomLine && (
          <div className={`text-xs ${statusColorClass}`}>
            {bottomLine}
          </div>
        )}
      </div>
    </div>
  );
};