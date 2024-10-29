import YuukiPS from '@/api/yuukips'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Tabs from './components/Tabs'
import axios from 'axios'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import ArgumentsContainer from './components/ArgsContainer'
import { Input } from '@/components/ui/input'
import { useCookies } from 'react-cookie'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

export type CommandOption = {
	value: string
	description: string
	remove?: boolean | string[] | string
	args?: Argument[]
}

export type DataArgs = {
	id: number
	options: {
		value: string
		description: string
	}[]
}

export type Argument = {
	key: string
	name: string
	description: string
	type: 'select' | 'search' | 'number' | 'string'
	limit?: {
		min: number
		max: number
	}
	options?: CommandOption[] | number // Can be array of options or reference to data id
	api?: {
		game: 'gi' | 'sr'
		jsonBody: {
			[key: string]: string | Array<string>
		}
	}
}

export type CommandLists = {
	id: number
	name: string
	command: string
	data?: DataArgs[] // Array of reusable option sets
	args?: Argument[]
}

export default function App() {
	const [commands, setCommands] = useState<CommandLists[]>([])
	const [selectedArgs, setSelectedArgs] = useState<{ [key: number]: { [key: string]: string } }>({})
	const [showResults, setShowResults] = useState(false)
	const [searchResults, setSearchResults] = useState<
		{ id: string; name: string; description: string | undefined; image: string | undefined }[]
	>([])
	const [visibleArgs, setVisibleArgs] = useState<{ [key: number]: boolean }>({})
	const { toast } = useToast()
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState(0)
	const [searchQuery, setSearchQuery] = useState('')
	const [yuukips, setYuukips] = useState<YuukiPS | null>(null)
	const [cookies] = useCookies(['uid', 'server', 'code'])
	const navigate = useNavigate()
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const copyToClipboard = useCallback(
		(text: string) => {
			const command = YuukiPS.generateResultCommand(text, {})
			navigator.clipboard.writeText(command).then(() => {
				toast({
					title: 'Copied!',
					description: 'Command copied to clipboard.',
				})
			})
		},
		[toast]
	)

	useEffect(() => {
		const yuukips = new YuukiPS()
		setYuukips(yuukips)
		yuukips.getResponseCommand((response) => {
			toast({
				title: 'Success',
				description: response.message,
			})
		})
	}, [toast])

	const applyCommand = useCallback(
		(command: string) => {
			if (!cookies.uid || !cookies.server || !cookies.code) {
				setIsDialogOpen(true)
				return
			}
			const resultCommand = YuukiPS.generateResultCommand(command, {})
			yuukips?.sendCommand(cookies.uid, cookies.code, cookies.server, resultCommand)
			toast({
				title: 'Success',
				description: 'Command applied.',
			})
		},
		[cookies, toast, yuukips]
	)

	const toggleArgsVisibility = useCallback((commandId: number) => {
		setVisibleArgs((prev) => ({
			...prev,
			[commandId]: !prev[commandId],
		}))
	}, [])

	const handleArgSelect = useCallback((commandId: number, argKey: string, value: string) => {
		setSelectedArgs((prev) => {
			if (value === 'none-selected') {
				// Create new object without this arg
				const newCommandArgs = { ...prev[commandId] }
				delete newCommandArgs[argKey]
				return {
					...prev,
					[commandId]: newCommandArgs,
				}
			}

			return {
				...prev,
				[commandId]: {
					...prev[commandId],
					[argKey]: value,
				},
			}
		})
	}, [])

	const getUpdatedCommand = useCallback(
		(cmd: CommandLists) => {
			let updatedCommand = cmd.command
			if (cmd.args && selectedArgs[cmd.id]) {
				for (const [key, selectedValue] of Object.entries(selectedArgs[cmd.id])) {
					// Skip slider toggle flags
					if (key.endsWith('-useSlider')) continue

					if (selectedValue && !key.includes('-useSlider')) {
						const regex = new RegExp(`<${key}>`, 'g')
						updatedCommand = updatedCommand.replace(regex, selectedValue.toString())
					}
				}
			}
			return updatedCommand
		},
		[selectedArgs]
	)

	const filteredCommands = useMemo(() => {
		const lowerQuery = searchQuery.toLowerCase()
		return commands.filter(
			(cmd) =>
				cmd.name.toLowerCase().includes(lowerQuery) ||
				cmd.command.toLowerCase().includes(lowerQuery) ||
				cmd.args?.some((arg) => {
					// Check arg name
					if (arg.name.toLowerCase().includes(lowerQuery)) return true

					// Handle select type args
					if (arg.type === 'select' && arg.options) {
						// If options is a number reference, look up in data
						if (typeof arg.options === 'number') {
							const dataSet = cmd.data?.find((d) => d.id === arg.options)
							return dataSet?.options.some(
								(opt) =>
									opt.value.toLowerCase().includes(lowerQuery) ||
									opt.description.toLowerCase().includes(lowerQuery)
							)
						}
						// If options is array, check directly
						return arg.options.some(
							(opt) =>
								opt.value.toLowerCase().includes(lowerQuery) ||
								opt.description.toLowerCase().includes(lowerQuery)
						)
					}
					return false
				})
		)
	}, [commands, searchQuery])

	useEffect(() => {
		const fetchCommands = async () => {
			try {
				setLoading(true)
				setCommands([])
				const { data } = await axios.get<CommandLists[]>(`/commands/${activeTab}.json`)
				setCommands(data)
			} catch (error) {
				console.error('Failed to fetch commands:', error)
				toast({
					title: 'Error',
					description: 'Failed to fetch commands. Please try again.',
					variant: 'destructive',
				})
			} finally {
				setLoading(false)
			}
		}
		fetchCommands()
	}, [toast, activeTab])

	return (
		<div className='container mx-auto p-4'>
			<Alert variant='default' className='mb-6'>
				<AlertTriangle className='h-4 w-4' />
				<AlertTitle>Work in Progress</AlertTitle>
				<AlertDescription>
					This feature is currently under development. Expect bugs or errors to occur. The UI and current
					functionality may change in the future as we continue to work on it. This is just a preview of what
					we are working on.
				</AlertDescription>
			</Alert>
			<Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Command List</CardTitle>
					<Input
						type='text'
						placeholder='Search commands...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full'
					/>
				</CardHeader>
				<CardContent>
					{loading && (
						<div className='flex items-center justify-center w-full h-64'>
							<Loader2 className='w-8 h-8 animate-spin text-gray-400 dark:text-gray-500' />
						</div>
					)}
					<div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
						{filteredCommands.map((cmd) => (
							<Card key={cmd.id} className='flex flex-col justify-between flex-grow'>
								<CardHeader>
									<CardTitle className='text-lg'>{cmd.name}</CardTitle>
								</CardHeader>
								<CardContent className='flex-grow'>
									<pre className='bg-muted p-2 rounded-md whitespace-pre-wrap mb-2'>
										<code>{getUpdatedCommand(cmd)}</code>
									</pre>
									<div className='flex justify-center mb-2'>
										<Button
											variant='secondary'
											size='sm'
											className='w-full rounded-r-none'
											onClick={() => copyToClipboard(getUpdatedCommand(cmd))}
										>
											Copy Command
										</Button>
										<Button
											variant='secondary'
											size='sm'
											className='w-full rounded-l-none'
											onClick={() => applyCommand(getUpdatedCommand(cmd))}
										>
											Apply Command
										</Button>
									</div>
									{cmd.args && cmd.args.length > 0 && (
										<Button
											variant='secondary'
											className='w-full'
											onClick={() => toggleArgsVisibility(cmd.id)}
										>
											{visibleArgs[cmd.id] ? 'Hide' : 'Show'} Arguments
										</Button>
									)}
									{visibleArgs[cmd.id] && (
										<div className='space-y-2'>
											{cmd.args?.map((arg) => (
												<ArgumentsContainer
													key={`${cmd.id}-${arg.key}`}
													cmd={cmd}
													arg={arg}
													handleArgSelect={handleArgSelect}
													commands={commands}
													selectedArgs={selectedArgs}
													showResults={showResults}
													searchResults={searchResults}
													setShowResults={setShowResults}
													setSearchResults={setSearchResults}
												/>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Please set your UID, Server, and Code</DialogTitle>
					</DialogHeader>
					<DialogDescription>
						<p>Please set your UID, Server, and Code in the settings page.</p>
					</DialogDescription>
					<DialogFooter>
						<Button variant={'outline'} onClick={() => setIsDialogOpen(false)}>
							Close
						</Button>
						<Button
							variant={'outline'}
							onClick={() => {
								setIsDialogOpen(false)
								navigate('/settings')
								window.location.reload()
							}}
						>
							Go to Settings
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
