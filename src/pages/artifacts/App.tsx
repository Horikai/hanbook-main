import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
	parseArtifactStats,
	generateCommand,
	parseStatName,
	calculateStatValue,
	MAIN_STAT_OPTIONS,
	getStatIdsByName,
	getStatValue,
} from './utils'
import type { ArtifactStat, FormData } from './types'
import { MultiSelect } from '@/components/ui/multi-select'
import { Search, Loader2, Copy, Plus, Minus, StarIcon } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDebouncedCallback } from 'use-debounce'
import elaxanApi from '@/api/elaxanApi'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import YuukiPS from '@/api/yuukips'

interface SearchResult {
	id: string
	name: string
	description?: string
	image?: string
	rarity?: number
}

const App = () => {
	const [stats, setStats] = useState<ArtifactStat[]>([])
	const [command, setCommand] = useState<string>('')
	const [formData, setFormData] = useState<FormData>({
		artifactId: '<artifact_id>',
		level: 1,
		amount: 1,
		stats: [],
		artifactType: 'FLOWER',
		mainStatId: '',
	})
	const [searchResults, setSearchResults] = useState<SearchResult[]>([])
	const [showResults, setShowResults] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setStats(parseArtifactStats())
	}, [])

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			mainStatId: MAIN_STAT_OPTIONS.HP.toString() || '',
		}))
	}, [])

	useEffect(() => {
		const cmd = generateCommand(
			formData.artifactId,
			formData.level,
			formData.amount,
			formData.stats.map((stat) => ({
				...stat,
				id: stat.targetId || stat.id,
			})),
			formData.mainStatId
		)
		setCommand(cmd)
	}, [formData])

	const handleStatSelect = (selectedValues: string[]) => {
		setFormData((prev) => ({
			...prev,
			stats: selectedValues.map((id) => {
				const stat = stats.find((s) => s.id === id)
				if (!stat) return { id, level: 1, valueIndex: 0 }

				const parsedStat = parseStatName(stat.name)
				const availableIds = getStatIdsByName(parsedStat.name)
				const sortedIds = [...availableIds].sort()
				const initialId = sortedIds[0] || id

				return {
					id: stat.id,
					targetId: initialId,
					level: 1,
					valueIndex: 0,
				}
			}),
		}))
	}

	const handleStatLevelChange = (index: number, increment: boolean) => {
		setFormData((prev) => {
			const updatedStats = prev.stats.map((stat, i) => {
				if (i !== index) return stat
				const newLevel = increment ? stat.level + 1 : stat.level - 1
				return newLevel > 0 ? { ...stat, level: newLevel } : stat
			})
			return { ...prev, stats: updatedStats }
		})
	}

	const handleStatValueChange = (index: number, newId: string) => {
		setFormData((prev) => ({
			...prev,
			stats: prev.stats.map((stat, i) =>
				i === index
					? {
							...stat,
							targetId: newId,
						}
					: stat
			),
		}))
	}

	const copyCommand = () => {
		const formattedCommand = YuukiPS.generateResultCommand(command, {})
		navigator.clipboard
			.writeText(formattedCommand)
			.then(() => {
				toast({
					title: 'Copied!',
					description: 'Command copied to clipboard',
					duration: 2000,
				})
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err)
				toast({
					title: 'Failed to copy!',
					description: `Failed to copy command: ${err.message}`,
					duration: 2000,
				})
			})
	}

	const renderStatPreview = () => {
		return formData.stats.map((selectedStat, index) => {
			const stat = stats.find((s) => s.id === selectedStat.id)
			if (!stat) return null

			const parsedStat = parseStatName(stat.name)
			const availableIds = getStatIdsByName(parsedStat.name)
			const sortedIds = [...availableIds].sort()
			const currentId = selectedStat.targetId || sortedIds[0]
			const currentIndex = sortedIds.indexOf(currentId)

			const calculatedValue = calculateStatValue(currentId, selectedStat.level, parsedStat.type, parsedStat.name)

			const currentValue = getStatValue(currentId)
			const maxValue = Math.max(0, sortedIds.length - 1)

			return (
				<Card key={`preview-${selectedStat.id}-${index}`} className='bg-secondary/50'>
					<CardContent className='flex flex-col gap-4 p-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Badge variant='outline' className='font-medium'>
									{parsedStat.name}
								</Badge>
								<span className='text-primary'>
									{parsedStat.type === '%' ? calculatedValue : `+${calculatedValue}`}
								</span>
							</div>
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='icon'
									onClick={() => handleStatLevelChange(index, false)}
								>
									<Minus className='h-4 w-4' />
								</Button>
								<span className='w-8 text-center font-medium'>{selectedStat.level}</span>
								<Button
									variant='outline'
									size='icon'
									onClick={() => handleStatLevelChange(index, true)}
								>
									<Plus className='h-4 w-4' />
								</Button>
							</div>
						</div>

						<div className='space-y-2'>
							<div className='flex justify-between text-sm'>
								<span className='text-muted-foreground'>Value</span>
								<span className='font-medium'>
									{currentValue}
									{parsedStat.type}
								</span>
							</div>
							<Slider
								value={[currentIndex >= 0 ? currentIndex : 0]}
								onValueChange={(value) => {
									const newId = sortedIds[value[0]]
									if (newId) {
										handleStatValueChange(index, newId)
									}
								}}
								max={maxValue}
								min={0}
								step={1}
								className='w-full'
							/>
						</div>
					</CardContent>
				</Card>
			)
		})
	}

	const handleSearch = useDebouncedCallback(async (query: string) => {
		if (!query.trim()) {
			setSearchResults([])
			setShowResults(false)
			return
		}

		try {
			setIsLoading(true)
			const results = await elaxanApi.getHandbook('https://api.elaxan.xyz', 'gi', {
				search: [query],
				limit: 10,
				category: ['artifact'],
				command: false,
			})

			setSearchResults(
				results.map((result) => ({
					name: result.name,
					id: result.id.toString(),
					description: result.description,
					image: typeof result.image === 'string' ? result.image : result.image?.icon,
					rarity: result.rarity,
				}))
			)
			setShowResults(true)
		} catch (error) {
			console.error('Failed to fetch search results:', error)
		} finally {
			setIsLoading(false)
		}
	}, 500)

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (showResults) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedIndex((prevIndex) => {
					const newIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
					setTimeout(() => {
						const selectedElement = document.querySelector(`[data-index="${newIndex}"]`)
						selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
					}, 0)
					return newIndex
				})
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedIndex((prevIndex) => {
					const newIndex = prevIndex > 0 ? prevIndex - 1 : -1
					setTimeout(() => {
						const selectedElement = document.querySelector(`[data-index="${newIndex}"]`)
						selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
					}, 0)
					return newIndex
				})
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
					const result = searchResults[selectedIndex]
					setFormData((prev) => ({
						...prev,
						artifactId: result.id,
						artifactDetails: {
							name: result.name,
							description: result.description,
							image: result.image,
							rarity: result.rarity,
						},
					}))
					setInputValue(result.name)
					setShowResults(false)
					setSelectedIndex(-1)
				}
			} else if (e.key === 'Escape') {
				setShowResults(false)
				setSelectedIndex(-1)
			}
		}
	}

	const getRarityClass = (rarity?: number) => {
		switch (rarity) {
			case 5:
				return 'bg-rarityFive'
			case 4:
				return 'bg-rarityFour'
			case 3:
				return 'bg-rarityThree'
			default:
				return ''
		}
	}

	const renderArtifactSearch = () => (
		<div className='relative'>
			<div className='relative'>
				<Input
					ref={inputRef}
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value)
						handleSearch(e.target.value)
					}}
					onKeyDown={handleKeyDown}
					onFocus={() => setShowResults(true)}
					placeholder='Search artifact...'
					className='w-full px-4 py-2 pl-10 pr-4'
				/>
				<div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
					{isLoading ? (
						<Loader2 className='w-4 h-4 animate-spin text-gray-400 dark:text-gray-500' />
					) : (
						<Search className='w-4 h-4 text-gray-400 dark:text-gray-500' />
					)}
				</div>
			</div>

			{showResults && searchResults.length > 0 && (
				<div className='absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg'>
					<ScrollArea className='h-[200px] w-full'>
						<div className='p-1'>
							<div className='w-full'>
								{searchResults.map((result, index) => (
									<button
										key={result.id}
										type='button'
										data-index={index}
										className={`w-full flex items-center gap-2 px-4 py-2 cursor-pointer rounded-sm transition-colors text-left ${
											index === selectedIndex
												? 'bg-primary text-primary-foreground'
												: 'hover:bg-accent'
										}`}
										onMouseEnter={() => setSelectedIndex(index)}
										onClick={() => {
											setFormData((prev) => ({
												...prev,
												artifactId: result.id,
												artifactDetails: {
													name: result.name,
													description: result.description,
													image: result.image,
													rarity: result.rarity,
												},
											}))
											setInputValue(result.name)
											setShowResults(false)
											setSelectedIndex(-1)
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												setFormData((prev) => ({
													...prev,
													artifactId: result.id,
													artifactDetails: {
														name: result.name,
														description: result.description,
														image: result.image,
														rarity: result.rarity,
													},
												}))
												setInputValue(result.name)
												setShowResults(false)
												setSelectedIndex(-1)
											}
										}}
									>
										{result.image && (
											<img
												src={result.image}
												alt=''
												className={`w-8 h-8 rounded ${
													result.rarity && getRarityClass(result.rarity)
												}`}
												aria-hidden='true'
											/>
										)}
										<span>{result.name}</span>
									</button>
								))}
							</div>
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	)

	const renderGuide = () => (
		<div className='space-y-3 text-muted-foreground'>
			<p className='flex items-center gap-2'>
				<span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm'>
					1
				</span>
				Search and select your desired artifact
			</p>
			<p className='flex items-center gap-2'>
				<span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm'>
					2
				</span>
				Choose the artifact type and set level/amount
			</p>
			<p className='flex items-center gap-2'>
				<span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm'>
					3
				</span>
				Add up to 4 stats and adjust their levels
			</p>
			<p className='flex items-center gap-2'>
				<span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm'>
					4
				</span>
				Copy the generated command
			</p>
		</div>
	)

	const renderMainStatSelect = () => (
		<div className='space-y-2'>
			<Label>Main Stat</Label>
			<Select
				value={formData.mainStatId}
				onValueChange={(value: string) => setFormData((prev) => ({ ...prev, mainStatId: value }))}
			>
				<SelectTrigger>
					<SelectValue placeholder='Select main stat' />
				</SelectTrigger>
				<SelectContent>
					{Object.entries(MAIN_STAT_OPTIONS).map(([key, value]) => (
						<SelectItem key={value} value={value.toString()}>
							{key}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)

	const renderArtifactDetails = () => {
		if (!formData.artifactDetails) return null

		return (
			<Card className={`${getRarityClass(formData.artifactDetails.rarity)} bg-opacity-10`}>
				<CardHeader className='flex flex-row items-center gap-4'>
					{formData.artifactDetails.image && (
						<div className='p-1 rounded-lg'>
							<img
								src={formData.artifactDetails.image}
								alt={formData.artifactDetails.name}
								className={`w-16 h-16 rounded-lg object-cover ${
									formData.artifactDetails.rarity && getRarityClass(formData.artifactDetails.rarity)
								}`}
							/>
						</div>
					)}
					<div className='space-y-1'>
						<h3 className='font-semibold text-foreground'>{formData.artifactDetails.name}</h3>
						{formData.artifactDetails.description && (
							<p className='text-sm text-foreground/80'>{formData.artifactDetails.description}</p>
						)}
						{formData.artifactDetails.rarity && (
							<div className='flex items-center gap-1'>
								{Array.from({ length: formData.artifactDetails.rarity }).map((_, i) => (
									<StarIcon
										key={`star-${formData.artifactDetails?.rarity}-${i}`}
										className='w-4 h-4 text-yellow-400 fill-current'
									/>
								))}
							</div>
						)}
					</div>
				</CardHeader>
			</Card>
		)
	}

	return (
		<div className='min-h-screen p-4 md:p-8 space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4 max-w-2xl mx-auto'>
				<h1 className='text-3xl md:text-4xl font-bold tracking-tight'>Custom Artifact Generator</h1>
				<div className='space-y-2'>
					<p className='text-muted-foreground'>
						Create perfect artifacts with custom stats and levels for your characters
					</p>
				</div>
			</div>

			<div className='max-w-7xl mx-auto'>
				<Tabs defaultValue='generator' className='space-y-6'>
					<TabsList className='grid w-full grid-cols-2 lg:w-[400px]'>
						<TabsTrigger value='generator'>Generator</TabsTrigger>
						<TabsTrigger value='guide'>How to Use</TabsTrigger>
					</TabsList>

					<TabsContent value='guide' className='space-y-4'>
						<div className='rounded-lg border bg-card p-6'>
							<h2 className='text-lg font-semibold mb-4'>Quick Guide</h2>
							{renderGuide()}
						</div>
					</TabsContent>

					<TabsContent value='generator'>
						<div className='grid lg:grid-cols-[1fr,400px] gap-8'>
							{/* Left Column - Form */}
							<div className='space-y-8'>
								{/* Search and Type Selection */}
								<div className='grid sm:grid-cols-2 gap-6'>
									<div className='space-y-2'>
										<Label>Artifact Name</Label>
										{renderArtifactSearch()}
									</div>
									{renderMainStatSelect()}
								</div>

								{/* Artifact Details */}
								{renderArtifactDetails()}

								{/* Amount and Level */}
								<div className='grid sm:grid-cols-2 gap-6'>
									<div className='space-y-2'>
										<Label>Amount</Label>
										<Input
											type='number'
											min='1'
											max='999'
											value={formData.amount}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													amount: Math.max(
														1,
														Math.min(999, Number.parseInt(e.target.value) || 1)
													),
												}))
											}
										/>
									</div>
									<div className='space-y-4'>
										<div className='flex justify-between'>
											<Label>Level</Label>
											<span className='text-sm font-medium text-primary'>{formData.level}</span>
										</div>
										<Slider
											value={[formData.level]}
											onValueChange={(value) =>
												setFormData((prev) => ({ ...prev, level: value[0] }))
											}
											max={20}
											min={0}
											step={1}
										/>
									</div>
								</div>

								{/* Stats Selection */}
								<div className='space-y-2'>
									<Label>Stats Selection</Label>
									<MultiSelect
										options={stats.map((stat) => ({
											label: stat.name,
											value: stat.id,
										}))}
										maxCount={4}
										selectLimit={4}
										limitReachedMessage='Maximum 4 stats allowed'
										placeholder='Select artifact stats'
										defaultValue={[]}
										onValueChange={handleStatSelect}
									/>
								</div>
							</div>

							{/* Right Column - Preview */}
							<div className='space-y-6'>
								{/* Stats Preview */}
								<div className='rounded-lg border bg-card p-6'>
									<h2 className='text-lg font-medium flex items-center gap-2'>
										Stats Preview
										<span className='text-xs text-muted-foreground font-normal'>
											(Up to 4 stats)
										</span>
									</h2>
									<p className='text-sm text-muted-foreground/60 mb-4'>
										The result may can be random on the game.
									</p>
									<div className='space-y-3'>
										{formData.stats.length > 0 ? (
											renderStatPreview()
										) : (
											<div className='text-center py-8 text-muted-foreground border border-dashed rounded-lg'>
												Select stats to preview them here
											</div>
										)}
									</div>
								</div>

								{/* Command Output */}
								{command && (
									<div className='rounded-lg border bg-card p-6'>
										<h2 className='text-lg font-medium mb-4'>Command</h2>
										<div className='flex items-center gap-2 bg-muted p-3 rounded-lg'>
											<code className='flex-1 font-mono text-sm break-all'>{command}</code>
											<Button
												variant='ghost'
												size='icon'
												onClick={copyCommand}
												className='hover:bg-muted-foreground/10'
											>
												<Copy className='h-4 w-4' />
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}

export default App
