/**
 * DATE UTILITIES - WhatsApp-style Date Formatting
 * 
 * These functions format dates in a user-friendly way:
 * - "Just now" for messages < 1 minute old
 * - "5m ago" for messages < 1 hour old
 * - "2h ago" for messages < 24 hours old
 * - "Today 3:45 PM" for today's messages
 * - "Yesterday 10:30 AM" for yesterday
 * - "Dec 5, 2:15 PM" for this week
 * - "Dec 5, 2024" for older messages
 */

/**
 * Format timestamp like WhatsApp (relative time with smart formatting)
 * @param dateStr - ISO date string from backend
 * @returns Formatted time string
 */
export function formatMessageTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown time';
  
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Less than 1 minute: "Just now"
    if (diffMins < 1) {
      return 'Just now';
    }
    
    // Less than 1 hour: "5m ago"
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    
    // Less than 24 hours: "2h ago"
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    // Today: "Today 3:45 PM"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);
    
    if (messageDate.getTime() === today.getTime()) {
      return `Today ${formatTime12Hour(date)}`;
    }
    
    // Yesterday: "Yesterday 10:30 AM"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${formatTime12Hour(date)}`;
    }
    
    // This week (last 7 days): "Mon 2:15 PM"
    if (diffDays < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} ${formatTime12Hour(date)}`;
    }
    
    // This year: "Dec 5, 2:15 PM"
    if (date.getFullYear() === now.getFullYear()) {
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${monthDay}, ${formatTime12Hour(date)}`;
    }
    
    // Older: "Dec 5, 2024"
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown time';
  }
}

/**
 * Format time in 12-hour format with AM/PM
 * @param date - Date object
 * @returns Time string like "3:45 PM"
 */
function formatTime12Hour(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Format for conversation list (shorter version)
 * @param dateStr - ISO date string from backend
 * @returns Formatted time string
 */
export function formatConversationTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    // Less than 1 minute: "Just now"
    if (diffMins < 1) {
      return 'Just now';
    }
    
    // Less than 1 hour: "5m"
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    
    // Less than 24 hours: "2h"
    if (diffHours < 24) {
      return `${diffHours}h`;
    }
    
    // Today: time only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);
    
    if (messageDate.getTime() === today.getTime()) {
      return formatTime12Hour(date);
    }
    
    // Yesterday: "Yesterday"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    // This week: day name
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // This year: "Dec 5"
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Older: "Dec 5, 2024"
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
  } catch (error) {
    console.error('Error formatting conversation time:', error);
    return '';
  }
}

/**
 * Format full date and time for notifications
 * @param dateStr - ISO date string from backend
 * @returns Formatted string like "December 5, 2024 at 3:45 PM"
 */
export function formatFullDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown time';
  
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
  } catch (error) {
    console.error('Error formatting full date time:', error);
    return 'Unknown time';
  }
}

/**
 * Simple relative time (for quick display)
 * @param dateStr - ISO date string
 * @returns String like "2 hours ago" or "3 days ago"
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown time';
  
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
    
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
}
