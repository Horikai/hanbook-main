import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
	parseArtifactStats,
	generateCommand,
	parseStatName,
	calculateStatValue,
	ARTIFACT_TYPES,
	MAIN_STAT_OPTIONS,
} from './utils'
import type { ArtifactStat, FormData } from './types'
import { MultiSelect } from '@/components/ui/multi-select'
import { Search, Loader2, Copy, Plus, Minus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { debounce } from 'lodash'
import elaxanApi from '@/api/elaxanApi'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface SearchResult {
	id: string
	name: string
	description?: string
	image?: string
}

const App = () => {
	const [stats, setStats] = useState<ArtifactStat[]>([])
	const [command, setCommand] = useState<string>('')
	// a placeholder data for testing
	// TODO: refactor this to use a select artifact id by it's name
	const [formData, setFormData] = useState<FormData>({
		artifactId: '32543',
		level: 20,
		amount: 1,
		stats: [],
		artifactType: 'FLOWER',
		mainStatId: '15001',
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
		const defaultMainStat = MAIN_STAT_OPTIONS[formData.artifactType][0]
		setFormData((prev) => ({
			...prev,
			mainStatId: defaultMainStat.id,
		}))
	}, [formData.artifactType])

	useEffect(() => {
		const cmd = generateCommand(
			formData.artifactId,
			formData.level,
			formData.amount,
			formData.stats,
			formData.mainStatId
		)
		setCommand(cmd)
	}, [formData])

	const handleStatSelect = (selectedValues: string[]) => {
		setFormData((prev) => ({
			...prev,
			stats: selectedValues.map((id) => ({ id, level: 1 })),
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

	const copyCommand = () => {
		navigator.clipboard.writeText(command)
		toast({
			title: 'Copied!',
			description: 'Command copied to clipboard',
			duration: 2000,
		})
	}

	const renderStatPreview = () => {
		return formData.stats.map((selectedStat, index) => {
			const stat = stats.find((s) => s.id === selectedStat.id)
			if (!stat) return null

			const parsedStat = parseStatName(stat.name)
			const calculatedValue = calculateStatValue(
				parsedStat.value,
				selectedStat.level,
				parsedStat.type,
				parsedStat.name
			)

			return (
				<Card key={`preview-${selectedStat.id}-${index}`} className='bg-secondary/50'>
					<CardContent className='flex items-center justify-between p-4'>
						<div className='flex items-center gap-2'>
							<Badge variant='outline' className='font-medium'>
								{parsedStat.name}
							</Badge>
							<span className='text-primary'>+{calculatedValue}</span>
						</div>
						<div className='flex items-center gap-2'>
							<Button variant='outline' size='icon' onClick={() => handleStatLevelChange(index, false)}>
								<Minus className='h-4 w-4' />
							</Button>
							<span className='w-8 text-center font-medium'>{selectedStat.level}</span>
							<Button variant='outline' size='icon' onClick={() => handleStatLevelChange(index, true)}>
								<Plus className='h-4 w-4' />
							</Button>
						</div>
					</CardContent>
				</Card>
			)
		})
	}

	const handleSearch = useCallback(
		debounce(async (query: string) => {
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
					}))
				)
				setShowResults(true)
			} catch (error) {
				console.error('Failed to fetch search results:', error)
			} finally {
				setIsLoading(false)
			}
		}, 500),
		[]
	)

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (showResults) {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedIndex((prevIndex) => {
					const newIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
					// Scroll the selected item into view
					const selectedElement = document.querySelector(`[data-index="${newIndex}"]`)
					selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
					return newIndex
				})
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedIndex((prevIndex) => {
					const newIndex = prevIndex > 0 ? prevIndex - 1 : -1
					// Scroll the selected item into view
					const selectedElement = document.querySelector(`[data-index="${newIndex}"]`)
					selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
					return newIndex
				})
			} else if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault()
				if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
					const result = searchResults[selectedIndex]
					setFormData((prev) => ({ ...prev, artifactId: result.id }))
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
					onBlur={() => setTimeout(() => setShowResults(false), 200)}
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
							<select
								tabIndex={0}
								className='w-full bg-transparent outline-none'
								size={Math.min(searchResults.length, 5)}
								value={selectedIndex}
								onChange={(e) => {
									const index = Number(e.target.value)
									const result = searchResults[index]
									setFormData((prev) => ({ ...prev, artifactId: result.id }))
									setInputValue(result.name)
									setShowResults(false)
								}}
								onKeyDown={(e) => {
									if (e.key === 'Escape') {
										setShowResults(false)
										setSelectedIndex(-1)
									}
								}}
							>
								{searchResults.map((result, index) => (
									<option
										key={result.id}
										value={index}
										className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded-sm transition-colors ${
											index === selectedIndex
												? 'bg-primary text-primary-foreground'
												: 'hover:bg-accent'
										}`}
									>
										<div className='flex items-center gap-2'>
											{result.image && (
												<img
													src={result.image}
													alt=''
													className='w-8 h-8 rounded'
													aria-hidden='true'
												/>
											)}
											<span>{result.name}</span>
										</div>
									</option>
								))}
							</select>
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
					{MAIN_STAT_OPTIONS[formData.artifactType].map((option) => (
						<SelectItem key={option.id} value={option.id}>
							{option.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)

	return (
		<div className='min-h-screen p-4 md:p-8 space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4 max-w-2xl mx-auto'>
				<h1 className='text-3xl md:text-4xl font-bold tracking-tight'>Custom Artifact Generator</h1>
				<div className='space-y-2'>
					<p className='text-muted-foreground'>
						Create perfect artifacts with custom stats and levels for your characters
					</p>
					<p className='text-sm text-muted-foreground/60'>
						This site uses data from{' '}
						<a
							href='https://null-grasscutter-tools.vercel.app'
							target='_blank'
							rel='noopener noreferrer'
							className='underline hover:text-primary'
						>
							Null Grasscutter Tools
						</a>{' '}
						by Null. All credit for the artifact data goes to them.
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
									<div className='space-y-2'>
										<Label>Artifact Type</Label>
										<Select
											value={formData.artifactType}
											onValueChange={(value: string) =>
												setFormData((prev) => ({ ...prev, artifactType: value }))
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Select type' />
											</SelectTrigger>
											<SelectContent>
												{Object.keys(ARTIFACT_TYPES).map((type) => (
													<SelectItem key={type} value={type}>
														{type.charAt(0) + type.slice(1).toLowerCase()}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{renderMainStatSelect()}
								</div>

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
									<h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
										Stats Preview
										<span className='text-xs text-muted-foreground font-normal'>
											(Up to 4 stats)
										</span>
									</h2>
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
