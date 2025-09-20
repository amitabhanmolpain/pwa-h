/**
 * Notification utilities for the app
 * Handles both in-app toasts and system notifications
 */
import { toast } from "@/hooks/use-toast";

/**
 * Determines if the current device is a mobile device
 * @returns boolean indicating if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

/**
 * Determines if the app is running as a PWA (Progressive Web App)
 * @returns boolean indicating if app is in standalone mode (PWA)
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

/**
 * Checks if the current device supports notifications
 * @returns boolean indicating notification support
 */
export const supportsNotifications = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Requests permission for sending notifications
 * @returns Promise that resolves to the permission state
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!supportsNotifications()) {
    return 'denied';
  }
  
  return await Notification.requestPermission();
};

/**
 * Sends a notification to the user, using system notifications for mobile and PWA,
 * and toast for desktop web browsers
 * 
 * @param title Title of the notification
 * @param options Notification options including body text
 */
export const sendNotification = (
  title: string, 
  options: { 
    body: string; 
    icon?: string;
    variant?: 'default' | 'destructive';
    requireInteraction?: boolean;
    onClick?: () => void;
  }
): void => {
  const isMobile = isMobileDevice();
  const isPwaMode = isPWA();
  
  // Always show toast notification in the web app
  toast({
    title,
    description: options.body,
    variant: options.variant || 'default',
  });
  
  // For mobile or PWA, also show a system notification if permission is granted
  if ((isMobile || isPwaMode) && supportsNotifications() && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        requireInteraction: options.requireInteraction || false
      });
      
      if (options.onClick) {
        notification.onclick = options.onClick;
      }
    } catch (error) {
      console.error('Failed to send system notification:', error);
    }
  }
};

/**
 * Sends a bus arrival notification
 * 
 * @param busRoute The bus route number/name
 * @param location Location where the bus has arrived
 */
export const sendBusArrivalNotification = (busRoute: string, location: string): void => {
  sendNotification(
    '🚌 Bus Arrived!', 
    {
      body: `Your bus ${busRoute} has arrived at ${location}. Please board now!`,
      icon: '/icon-512.png',
      variant: 'destructive',
      requireInteraction: true,
      onClick: () => {
        // Focus the window and navigate to tracking page if needed
        if (window.focus) window.focus();
      }
    }
  );
};

/**
 * Sends a bus approaching notification
 * 
 * @param busRoute The bus route number/name
 * @param location Location where the bus is approaching
 * @param timeInMinutes Time in minutes until arrival
 */
export const sendBusApproachingNotification = (
  busRoute: string, 
  location: string,
  timeInMinutes: number
): void => {
  sendNotification(
    '🚌 Bus Approaching', 
    {
      body: `Your bus ${busRoute} is approaching ${location} in ${timeInMinutes} minutes`,
      icon: '/icon-512.png',
      variant: 'default'
    }
  );
};

/**
 * Sends a journey started notification
 * 
 * @param busRoute The bus route number/name
 * @param from Departure location
 * @param to Destination location
 */
export const sendJourneyStartedNotification = (
  busRoute: string,
  from: string,
  to: string
): void => {
  sendNotification(
    '🚌 Journey Started', 
    {
      body: `Your bus ${busRoute} has departed from ${from} and is on its way to ${to}`,
      icon: '/icon-512.png',
      variant: 'default'
    }
  );
};