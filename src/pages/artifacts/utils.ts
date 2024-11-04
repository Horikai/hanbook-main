import type { ArtifactStat, ParsedStat } from './types'

export const ARTIFACT_STATS = [
	// HP
	{ name: 'FIGHT_PROP_HP +299', id: '501024', baseValue: 299, type: '' },
	{ name: 'FIGHT_PROP_HP_PERCENT +5.83%', id: '501034', baseValue: 5.83, type: '%' },

	// ATK
	{ name: 'FIGHT_PROP_ATTACK +19', id: '501054', baseValue: 19, type: '' },
	{ name: 'FIGHT_PROP_ATTACK_PERCENT +5.83%', id: '501064', baseValue: 5.83, type: '%' },

	// DEF
	{ name: 'FIGHT_PROP_DEFENSE +23', id: '501084', baseValue: 23, type: '' },
	{ name: 'FIGHT_PROP_DEFENSE_PERCENT +7.29%', id: '501094', baseValue: 7.29, type: '%' },

	// Crit
	{ name: 'FIGHT_PROP_CRITICAL +3.89%', id: '501204', baseValue: 3.89, type: '%' },
	{ name: 'FIGHT_PROP_CRITICAL_HURT +7.77%', id: '501224', baseValue: 7.77, type: '%' },

	// Other Stats
	{ name: 'FIGHT_PROP_CHARGE_EFFICIENCY +6.48%', id: '501234', baseValue: 6.48, type: '%' },
	{ name: 'FIGHT_PROP_ELEMENT_MASTERY +23', id: '501244', baseValue: 23, type: '' },

	// Special Stats
	{ name: 'FIGHT_PROP_SHIELD_COST_MINUS_RATIO +1', id: '992001', baseValue: 1, type: '%' },
	{ name: 'FIGHT_PROP_HEAL_ADD +1', id: '991001', baseValue: 1, type: '%' },
	{ name: 'FIGHT_PROP_HEALED_ADD +1', id: '990001', baseValue: 1, type: '%' },
	{ name: 'FIGHT_PROP_SKILL_CD_MINUS_RATIO +1', id: '989001', baseValue: 1, type: '%' },
	{ name: 'FIGHT_PROP_SPEED_PERCENT +30.00%', id: '988001', baseValue: 30, type: '%' },
] as const

export const parseArtifactStats = (): ArtifactStat[] => {
	return ARTIFACT_STATS.map((stat) => ({
		name: formatStatName(stat.name.split(' ')[0].replace('FIGHT_PROP_', '')),
		value: `${stat.baseValue}${stat.type}`,
		id: stat.id,
	}))
}

export const formatStatName = (name: string): string => {
	const statNameMap: { [key: string]: string } = {
		HP: 'HP',
		HP_PERCENT: 'HP%',
		ATTACK: 'ATK',
		ATTACK_PERCENT: 'ATK%',
		DEFENSE: 'DEF',
		DEFENSE_PERCENT: 'DEF%',
		CRITICAL: 'CRIT Rate',
		CRITICAL_HURT: 'CRIT DMG',
		CHARGE_EFFICIENCY: 'Energy Recharge',
		ELEMENT_MASTERY: 'Elemental Mastery',
		HEAL_ADD: 'Healing Bonus',
		HEALED_ADD: 'Incoming Healing Bonus',
		SKILL_CD_MINUS_RATIO: 'Cooldown Reduction',
		SPEED_PERCENT: 'Movement SPD',
	}

	return statNameMap[name] || name.replace(/_/g, ' ')
}

export const parseStatName = (stat: string): ParsedStat => {
	// Find the stat in ARTIFACT_STATS by ID or name
	const foundStat = ARTIFACT_STATS.find(
		(s) => s.name === stat || formatStatName(s.name.split(' ')[0].replace('FIGHT_PROP_', '')) === stat
	)

	if (foundStat) {
		return {
			name: formatStatName(foundStat.name.split(' ')[0].replace('FIGHT_PROP_', '')),
			value: foundStat.baseValue,
			type: foundStat.type,
		}
	}

	return { name: stat, value: 0, type: '' }
}

export const calculateStatValue = (statId: string, level: number, type: string, statName: string): string => {
	// Special cases for stats that need different multipliers
	switch (statName) {
		case 'Cooldown Reduction':
			return `${(level * 50).toFixed(1)}%`
		case 'Healing Bonus':
		case 'Incoming Healing Bonus':
			return `${(level * 80).toFixed(1)}%`
	}

	const baseValue = getStatValue(statId)
	const value = baseValue * level

	// Format the output based on the stat type
	if (type === '%' || statName.includes('%') || ['CRIT Rate', 'CRIT DMG', 'Energy Recharge'].includes(statName)) {
		return `${value.toFixed(1)}%`
	}

	return Math.round(value).toString()
}

export const generateCommand = (
	artifactId: string,
	level: number,
	amount: number,
	selectedStats: { id: string; level: number }[],
	mainStatId: string
): string => {
	const statsString = selectedStats.map((stat) => `${stat.id},${stat.level}`).join(' ')
	return `/give ${artifactId} lv${level} x${amount} ${mainStatId} ${statsString}`
}

export const MAIN_STAT_OPTIONS: Record<string, number> = {
	HP: 15001,
	ATK: 15003,
	'HP%': 50980,
	'ATK%': 50990,
	'DEF%': 50970,
	'Elemental Mastery': 50880,
	'Energy Recharge': 10960,
	'CRIT Rate': 30960,
	'CRIT DMG': 30950,
	'Healing Bonus': 30940,
}

export const SUB_STAT_VALUES: Record<string, number> = {
	// HP
	'101021': 24,
	'101022': 30,
	'201021': 50,
	'201022': 61,
	'201023': 72,
	'301021': 100,
	'301022': 115,
	'301023': 129,
	'301024': 143,
	'401021': 167,
	'401022': 191,
	'401023': 215,
	'401024': 239,
	'501021': 209,
	'501022': 269,
	'501023': 299,
	'501024': 299,

	// HP%
	'101031': 1.17,
	'101032': 1.46,
	'201031': 1.63,
	'201032': 1.98,
	'201033': 2.33,
	'301031': 2.45,
	'301032': 2.8,
	'301033': 3.15,
	'301034': 3.5,
	'401031': 3.26,
	'401032': 3.73,
	'401033': 4.2,
	'401034': 4.66,
	'501031': 4.08,
	'501032': 4.66,
	'501033': 5.25,
	'501034': 5.83,

	// ATK
	'101051': 2,
	'101052': 2,
	'201051': 3,
	'201052': 4,
	'201053': 5,
	'301051': 7,
	'301052': 7,
	'301053': 8,
	'301054': 9,
	'401051': 11,
	'401052': 12,
	'401053': 14,
	'401054': 16,
	'501051': 14,
	'501052': 16,
	'501053': 18,
	'501054': 19,

	// ATK%
	'101061': 1.17,
	'101062': 1.46,
	'201061': 1.63,
	'201062': 1.98,
	'201063': 2.33,
	'301061': 2.45,
	'301062': 2.8,
	'301063': 3.15,
	'301064': 3.5,
	'401061': 3.26,
	'401062': 3.73,
	'401063': 4.2,
	'401064': 4.66,
	'501061': 4.08,
	'501062': 4.66,
	'501063': 5.25,
	'501064': 5.83,

	// DEF
	'101081': 2,
	'101082': 2,
	'201081': 4,
	'201082': 5,
	'201083': 6,
	'301081': 8,
	'301082': 9,
	'301083': 10,
	'301084': 11,
	'401081': 13,
	'401082': 15,
	'401083': 17,
	'401084': 19,
	'501081': 16,
	'501082': 19,
	'501083': 21,
	'501084': 23,

	// DEF%
	'101091': 1.46,
	'101092': 1.82,
	'201091': 2.04,
	'201092': 2.48,
	'201093': 2.91,
	'301091': 3.06,
	'301092': 3.5,
	'301093': 3.93,
	'301094': 4.37,
	'401091': 4.08,
	'401092': 4.66,
	'401093': 5.25,
	'401094': 5.83,
	'501091': 5.1,
	'501092': 5.83,
	'501093': 6.56,
	'501094': 7.29,

	// Energy Recharge
	'101231': 1.3,
	'101232': 1.62,
	'201231': 1.81,
	'201232': 2.2,
	'201233': 2.59,
	'301231': 2.72,
	'301232': 3.11,
	'301233': 3.5,
	'301234': 3.89,
	'401231': 3.63,
	'401232': 4.14,
	'401233': 4.66,
	'401234': 5.18,
	'501231': 4.53,
	'501232': 5.18,
	'501233': 5.83,
	'501234': 6.48,

	// Elemental Mastery
	'101241': 5,
	'101242': 6,
	'201241': 7,
	'201242': 8,
	'201243': 9,
	'301241': 10,
	'301242': 11,
	'301243': 13,
	'301244': 14,
	'401241': 13,
	'401242': 15,
	'401243': 17,
	'401244': 19,
	'501241': 16,
	'501242': 19,
	'501243': 21,
	'501244': 23,

	// CRIT Rate
	'101201': 0.78,
	'101202': 0.97,
	'201201': 1.09,
	'201202': 1.32,
	'201203': 1.55,
	'301201': 1.63,
	'301202': 1.86,
	'301203': 2.1,
	'301204': 2.33,
	'401201': 2.18,
	'401202': 2.49,
	'401203': 2.8,
	'401204': 3.11,
	'501201': 2.72,
	'501202': 3.11,
	'501203': 3.5,
	'501204': 3.89,

	// CRIT DMG
	'101221': 1.55,
	'101222': 1.94,
	'201221': 2.18,
	'201222': 2.64,
	'201223': 3.11,
	'301221': 3.26,
	'301222': 3.73,
	'301223': 4.2,
	'301224': 4.66,
	'401221': 4.35,
	'401222': 4.97,
	'401223': 5.6,
	'401224': 6.22,
	'501221': 5.44,
	'501222': 6.22,
	'501223': 6.99,
	'501224': 7.77,
} as const

export const getStatValue = (statId: string): number => {
	return SUB_STAT_VALUES[statId as keyof typeof SUB_STAT_VALUES] || 0
}

// Helper function to get all available stat IDs for a given stat name
export const getStatIdsByName = (statName: string): string[] => {
	// Create a mapping of stat patterns
	const statPatterns: Record<string, string> = {
		HP: '102',
		'HP%': '103',
		ATK: '105',
		'ATK%': '106',
		DEF: '108',
		'DEF%': '109',
		'Energy Recharge': '123',
		'Elemental Mastery': '124',
		'CRIT Rate': '120',
		'CRIT DMG': '122',
	}

	const pattern = statPatterns[statName]
	if (!pattern) return []

	// Get all IDs that match the pattern for this stat type
	return Object.keys(SUB_STAT_VALUES)
		.filter((id) => id.includes(pattern))
		.sort((a, b) => {
			// Sort by the numeric value of the stat
			const valueA = SUB_STAT_VALUES[a as keyof typeof SUB_STAT_VALUES]
			const valueB = SUB_STAT_VALUES[b as keyof typeof SUB_STAT_VALUES]
			return valueA - valueB
		})
}

// Helper function to get the stat name from an ID
export const getStatNameFromId = (statId: string): string => {
	// Extract the pattern from the ID (e.g., '102' from '101021')
	const pattern = statId.slice(2, 5)

	// Map patterns to stat names
	const patternToName: Record<string, string> = {
		'102': 'HP',
		'103': 'HP%',
		'105': 'ATK',
		'106': 'ATK%',
		'108': 'DEF',
		'109': 'DEF%',
		'123': 'Energy Recharge',
		'124': 'Elemental Mastery',
		'120': 'CRIT Rate',
		'122': 'CRIT DMG',
	}

	return patternToName[pattern] || ''
}
