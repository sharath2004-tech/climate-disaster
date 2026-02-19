/**
 * TypeScript Type Definitions for Climate Disaster Platform
 * Centralized types for better type safety across the application
 */

// ==================== User & Auth Types ====================

export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'responder';
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    city?: string;
    state?: string;
  };
  preferences?: {
    notifications: boolean;
    alertTypes: string[];
    radius: number;
  };
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone?: string;
}

// ==================== Alert Types ====================

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 
  | 'flood' 
  | 'fire' 
  | 'earthquake' 
  | 'hurricane' 
  | 'tornado' 
  | 'tsunami' 
  | 'drought' 
  | 'cyclone'
  | 'storm'
  | 'heatwave'
  | 'other';

export type AlertStatus = 'active' | 'resolved' | 'expired';

export interface Alert {
  _id: string;
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    radius?: number;
  };
  affectedAreas?: string[];
  instructions?: string[];
  issuedBy: string | User;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertData {
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  location: {
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    radius?: number;
  };
  affectedAreas?: string[];
  instructions?: string[];
  validUntil?: string;
}

export interface UpdateAlertData extends Partial<CreateAlertData> {
  status?: AlertStatus;
}

// ==================== Report Types ====================

export type ReportStatus = 'pending' | 'verified' | 'investigating' | 'resolved' | 'false';
export type ReportType = AlertType | 'infrastructure-damage' | 'medical-emergency' | 'other';

export interface Report {
  _id: string;
  reportedBy: string | User;
  type: ReportType;
  severity: AlertSeverity;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  photos?: string[];
  status: ReportStatus;
  verifiedBy?: string | User;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportData {
  type: ReportType;
  severity: AlertSeverity;
  description: string;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  photos?: string[];
}

export interface UpdateReportData extends Partial<CreateReportData> {
  status?: ReportStatus;
  notes?: string;
}

// ==================== Resource Types ====================

export type ResourceType = 'medical' | 'food' | 'water' | 'shelter' | 'supplies' | 'other';
export type ResourceStatus = 'available' | 'low' | 'depleted' | 'unavailable';

export interface Resource {
  _id: string;
  name: string;
  type: ResourceType;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    city?: string;
  };
  quantity?: number;
  status: ResourceStatus;
  contact?: {
    name: string;
    phone: string;
    email?: string;
  };
  addedBy: string | User;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  name: string;
  type: ResourceType;
  description?: string;
  location: {
    coordinates: [number, number];
    address?: string;
    city?: string;
  };
  quantity?: number;
  status: ResourceStatus;
  contact?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface UpdateResourceData extends Partial<CreateResourceData> {}

// ==================== Evacuation Types ====================

export interface EvacuationRoute {
  _id: string;
  name: string;
  startPoint: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  endPoint: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  waypoints?: Array<{
    type: 'Point';
    coordinates: [number, number];
    description?: string;
  }>;
  distance?: number;
  estimatedTime?: number;
  status: 'open' | 'congested' | 'closed';
  instructions?: string[];
  hazards?: string[];
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Shelter {
  _id: string;
  id?: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  contact?: {
    name: string;
    phone: string;
  };
  status: 'open' | 'full' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEvacuationRouteData {
  name: string;
  startPoint: {
    coordinates: [number, number];
    address?: string;
  };
  endPoint: {
    coordinates: [number, number];
    address?: string;
  };
  waypoints?: Array<{
    coordinates: [number, number];
    description?: string;
  }>;
  distance?: number;
  estimatedTime?: number;
  instructions?: string[];
  hazards?: string[];
}

// ==================== Community Types ====================

export interface CommunityPost {
  _id: string;
  author: string | User;
  title: string;
  content: string;
  category: 'update' | 'request' | 'offer' | 'question' | 'other';
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  attachments?: string[];
  likes: string[];
  comments: Array<{
    _id: string;
    author: string | User;
    content: string;
    createdAt: string;
  }>;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityPostData {
  title: string;
  content: string;
  category: 'update' | 'request' | 'offer' | 'question' | 'other';
  location?: {
    coordinates: [number, number];
    address?: string;
  };
  attachments?: string[];
}

// ==================== Weather Types ====================

export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feels_like?: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction?: number;
  conditions: string;
  description?: string;
  icon?: string;
  timestamp: number;
}

export interface RiskPrediction {
  location: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_type: AlertType;
  confidence: number;
  factors: Array<{
    name: string;
    value: number | string;
    contribution: number;
  }>;
  recommendations: string[];
  timestamp: number;
}

// ==================== API Response Types ====================

export interface APIResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== Query Parameter Types ====================

export interface AlertQueryParams {
  severity?: AlertSeverity;
  type?: AlertType;
  status?: AlertStatus;
  limit?: number;
  page?: number;
  includeDisabled?: string;
}

export interface ReportQueryParams {
  status?: ReportStatus;
  type?: ReportType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

export interface ResourceQueryParams {
  type?: ResourceType;
  status?: ResourceStatus;
  limit?: number;
  page?: number;
}

export interface CommunityQueryParams {
  category?: string;
  limit?: number;
  page?: number;
  sortBy?: 'recent' | 'popular';
}

// ==================== Map & Geolocation Types ====================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapMarker {
  id: string;
  position: Coordinates;
  type: 'alert' | 'resource' | 'shelter' | 'report' | 'user';
  data: Alert | Resource | Shelter | Report;
  severity?: AlertSeverity;
  icon?: string;
}

// ==================== Notification Types ====================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  severity?: AlertSeverity;
  requireInteraction?: boolean;
  vibrate?: number[];
  silent?: boolean;
}

// ==================== Form Types ====================

export interface LocationInput {
  lat: string;
  lon: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

// ==================== Error Types ====================

export interface APIError {
  error: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
}

// ==================== Statistics Types ====================

export interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  totalReports: number;
  verifiedReports: number;
  totalResources: number;
  availableResources: number;
  totalUsers: number;
  activeUsers: number;
}

export interface AlertStatistics {
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  recentTrend: Array<{
    date: string;
    count: number;
  }>;
}

// ==================== Pathway Service Types ====================

export interface PathwayReport {
  latitude: number;
  longitude: number;
  report_type: string;
  severity: number;
  description: string;
  image_url?: string;
  user_id?: string;
}

export interface PathwayResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  count?: number;
  message?: string;
}
