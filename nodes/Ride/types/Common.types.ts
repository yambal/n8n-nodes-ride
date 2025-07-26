/**
 * Common pagination metadata structure
 */
export interface PaginationMeta {
  total: number; // Total number of items
  page: number; // Current page number
  per_page: number; // Items per page
  total_pages: number; // Total number of pages
}

/**
 * User object from Ride with GPS API
 */
export interface User {
  id: number;
  name: string;
  email: string;
  locality?: string;
  administrative_area?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Event object from Ride with GPS API
 */
export interface Event {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  locality?: string;
  administrative_area?: string;
  country_code?: string;
  visibility: number;
  created_at: string;
  updated_at: string;
}

/**
 * Single event response from API
 */
export interface EventData {
  event: Event;
}

/**
 * Multiple events response from API with pagination metadata
 */
export interface EventsListResponse {
  events: Array<Event>;
  meta: PaginationMeta;
}