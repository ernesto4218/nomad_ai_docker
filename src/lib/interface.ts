export interface DeployResponse {
  generated_points: [number, number][];
  randomPoints: [number, number][];
  paths: [number, number][][];
}

export interface DeployAgentMapRequest {
		agentid: number,
    longitude: number;
    latitude: number;
    agentName: string;
    selectedClass: string;
    selectedAvatar: string;
}

export	interface Agent {
		id: number,
		name: string;
		avatar: string;
		generatedPoints: [number, number][];
		paths: [number, number][];
		deployedLat: [number, number][];
		deployedLng: [number, number][];
		classId: string;
		duration_hr: number;
		status: string;
		batteryLevel: number;
		deployedAt: Date;
		currentPoints: number;
		level: number;
	}

export interface CompleteTasks {
		taskName: string,
		type: string,
}

export interface DatafromTaskCompelte {
	success: boolean,
	balance: number,
	message: string,
}