import type { ArtifactStat, SelectedStat, ParsedStat, MainStatOption } from './types'

export const ARTIFACT_TYPES = {
	FLOWER: 'FLOWER',
	PLUME: 'PLUME',
	SANDS: 'SANDS',
	GOBLET: 'GOBLET',
	CIRCLET: 'CIRCLET',
} as const

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
		SHIELD_COST_MINUS_RATIO: 'Shield Strength',
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

export const calculateStatValue = (baseValue: number, level: number, type: string, statName: string): string => {
	// Special cases for stats that need different multipliers
	switch (statName) {
		case 'Cooldown Reduction':
			return `${(baseValue * level * 50).toFixed(1)}%`;
		
		case 'Healing Bonus':
		case 'Shield Strength':
		case 'Incoming Healing Bonus':
			return `${(baseValue * level * 80).toFixed(1)}%`;
		
		case 'HP':
			if (type === '') {
				return Math.round(baseValue * level * 3.7).toString();
			}
			break;
	}
	
	// For flat values (ATK, DEF)
	if (type === '') {
		return Math.round(baseValue * level).toString();
	}
	
	// For percentage values (HP%, ATK%, DEF%, CRIT, etc.)
	const value = baseValue * level;
	return `${value.toFixed(1)}%`;
};

export const generateCommand = (
	artifactId: string,
	level: number,
	amount: number,
	selectedStats: SelectedStat[],
	mainStatId: string,
): string => {
	const statsString = selectedStats.map((stat) => `${stat.id},${stat.level}`).join(' ')
	return `/give ${artifactId} lv${level} x${amount} ${mainStatId} ${statsString}`
}

export const MAIN_STAT_OPTIONS: Record<string, MainStatOption[]> = {
	FLOWER: [
		{ name: 'HP', id: 15001 },
	],
	PLUME: [
		{ name: 'ATK', id: 15003 },
	],
	SANDS: [
		{ name: 'ATK%', id: 50990 },
		{ name: 'HP%', id: 50980 },
		{ name: 'DEF%', id: 50970 },
		{ name: 'Elemental Mastery', id: 50880 },
		{ name: 'Energy Recharge', id: 10960 },
	],
	GOBLET: [
		{ name: 'Electro DMG Bonus', id: 50950 },
		{ name: 'Pyro DMG Bonus', id: 50960 },
		{ name: 'Cryo DMG Bonus', id: 50940 },
		{ name: 'Hydro DMG Bonus', id: 50930 },
		{ name: 'Physical DMG Bonus', id: 50920 },
		{ name: 'Anemo DMG Bonus', id: 50920 },
		{ name: 'Geo DMG Bonus', id: 50910 },
		{ name: 'Dendro DMG Bonus', id: 50900 },
		{ name: 'Physical DMG Bonus', id: 50890 },
		{ name: 'ATK%', id: 50990 },
		{ name: 'HP%', id: 50980 },
		{ name: 'DEF%', id: 50970 },
		{ name: 'Elemental Mastery', id: 50880 },
	],
	CIRCLET: [
		{ name: 'CRIT Rate', id: 30960 },
		{ name: 'CRIT DMG', id: 30950 },
		{ name: 'Healing Bonus', id: 30940 },
		{ name: 'ATK%', id: 50990 },
		{ name: 'HP%', id: 50980 },
		{ name: 'DEF%', id: 50970 },
		{ name: 'Elemental Mastery', id: 50880 },
	],
} as const;
