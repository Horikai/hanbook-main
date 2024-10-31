export interface ArtifactStat {
	name: string
	value: string
	id: string
}

export interface SelectedStat {
	id: string
	level: number
}

export interface ParsedStat {
	name: string
	value: number
	type: string
}

export interface MainStatOption {
	name: string
	id: string
}

export interface FormData {
	artifactId: string
	level: number
	amount: number
	stats: SelectedStat[]
	artifactType: string
	mainStatId: string
}