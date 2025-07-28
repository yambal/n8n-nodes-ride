export interface GPXTrackPoint {
	latitude?: number;
	longitude?: number;
	elevation?: number;
	x?: number;
	y?: number;
	e?: number;
	speed?: number;
	time?: Date | string;
	heart_rate?: number;
	cadence?: number;
}

export interface GPXTripData {
	trip: {
		id: string;
		name?: string;
		description?: string;
		start_time?: Date | string;
		end_time?: Date | string;
		track_points: GPXTrackPoint[];
		distance?: number;
		duration?: number;
		avg_speed?: number;
		max_speed?: number;
		start_location?: {
			name?: string;
			latitude?: number;
			longitude?: number;
		};
		end_location?: {
			name?: string;
			latitude?: number;
			longitude?: number;
		};
	};
}