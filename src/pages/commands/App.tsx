import YuukiPS from '@/api/yuukips'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Suspense, lazy } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

/**
 * Option for select type argument
 */
export type CommandOption = {
	/**
	 * Value of the option
	 */
	value: string
	/**
	 * Description of the option
	 */
	description: string
	/**
	 * Remove option, can be boolean or array of values to remove. To remove other options, use boolean true to remove all other options.
	 */
	remove?: boolean | string[] | string
	/**
	 * Arguments for the option
	 */
	args?: Argument[]
}

/**
 * Reusable option set, useful when the same option set is used in multiple commands
 */
export type DataArgs = {
	/**
	 * Unique ID of the data
	 */
	id: number
	/**
	 * Array of options
	 */
	options: {
		value: string
		description: string
	}[]
}

export type Argument = {
	/**
	 * Key of the argument from the command, example: <target> then key is target
	 */
	key: string
	/**
	 * Name of the argument
	 */
	name: string
	/**
	 * Description of the argument
	 */
	description: string
	/**
	 * Type of argument
	 */
	type: 'select' | 'search' | 'number' | 'string'
	/**
	 * Limit for number type only when used in number type
	 */
	limit?: {
		/**
		 * Minimum value
		 */
		min: number
		/**
		 * Maximum value
		 */
		max: number
	}
	/**
	 * Array of options or reference to data id
	 */
	options?: CommandOption[] | number
	/**
	 * API call to use
	 */
	api?: {
		/**
		 * Game to use
		 */
		game: 'gi' | 'sr'
		/**
		 * JSON body to send to the API
		 */
		jsonBody: {
			[key: string]: string | Array<string>
		}
	}
}

export type CommandLists = {
	/**
	 * Unique ID of the command
	 */
	id: number
	/**
	 * Name of the command
	 */
	name: string
	/**
	 * Command to apply
	 */
	command: string
	/**
	 * Array of reusable option sets, useful when the same option set is used in multiple commands
	 */
	data?: DataArgs[]
	/**
	 * Arguments of the command
	 */
	args?: Argument[]
	/**
	 * Description of the command
	 */
	description?: string
}

// Lazy load components
const Tabs = lazy(() => import('./components/Tabs'))
const ArgumentsContainer = lazy(() => import('./components/ArgsContainer'))

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
	const { t } = useTranslation()

	const copyToClipboard = useCallback(
		(text: string) => {
			const command = YuukiPS.generateResultCommand(text, {})
			navigator.clipboard.writeText(command).then(() => {
				toast({
					title: t('toast.copied'),
					description: t('toast.command_copied'),
				})
			})
		},
		[toast, t]
	)

	useEffect(() => {
		const yuukips = new YuukiPS()
		setYuukips(yuukips)
		yuukips.getResponseCommand((response) => {
			toast({
				title: t('toast.success'),
				description: response.message,
			})
		})
	}, [toast, t])

	const applyCommand = useCallback(
		(command: string) => {
			if (!cookies.uid || !cookies.server || !cookies.code) {
				setIsDialogOpen(true)
				return
			}
			const resultCommand = YuukiPS.generateResultCommand(command, {})
			yuukips?.sendCommand(cookies.uid, cookies.code, cookies.server, resultCommand)
			toast({
				title: t('toast.success'),
				description: t('toast.command_applied'),
			})
		},
		[cookies, toast, yuukips, t]
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
					title: t('toast.error.title'),
					description: t('toast.error.description'),
					variant: 'destructive',
				})
			} finally {
				setLoading(false)
			}
		}
		fetchCommands()
	}, [toast, activeTab, t])

	return (
		<motion.div
			className='container mx-auto p-4'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
		>
			<Suspense fallback={<Loader2 className='w-8 h-8 animate-spin text-gray-400 dark:text-gray-500' />}>
				<Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
			</Suspense>

			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>{t('title')}</CardTitle>
					<Input
						type='text'
						placeholder={t('search_placeholder')}
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
					<div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
						{filteredCommands.map((cmd) => (
							<motion.div key={cmd.id} className='flex flex-col justify-between flex-grow'>
								<CardHeader>
									<CardTitle className='text-lg'>{cmd.name}</CardTitle>
								</CardHeader>
								<CardContent className='flex-grow'>
									{cmd.description && (
										<CardDescription className='mb-2 -mt-6'>{cmd.description}</CardDescription>
									)}
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
											{t('copy_command')}
										</Button>
										<Button
											variant='secondary'
											size='sm'
											className='w-full rounded-l-none'
											onClick={() => applyCommand(getUpdatedCommand(cmd))}
										>
											{t('apply_command')}
										</Button>
									</div>
									{cmd.args && cmd.args.length > 0 && (
										<Button
											variant='secondary'
											className='w-full'
											onClick={() => toggleArgsVisibility(cmd.id)}
										>
											{visibleArgs[cmd.id] ? t('arguments.hide') : t('arguments.show')}
										</Button>
									)}
									{visibleArgs[cmd.id] && (
										<Suspense
											fallback={
												<div className='space-y-2 p-4'>
													<Loader2 className='w-6 h-6 animate-spin text-gray-400 dark:text-gray-500' />
												</div>
											}
										>
											<div className='space-y-2'>
												{cmd.args?.map((arg) => (
													<ArgumentsContainer
														key={`${cmd.id}-${arg.key}`}
														cmd={cmd}
														arg={arg}
														handleArgSelect={handleArgSelect}
														selectedArgs={selectedArgs}
														showResults={showResults}
														searchResults={searchResults}
														setShowResults={setShowResults}
														setSearchResults={setSearchResults}
													/>
												))}
											</div>
										</Suspense>
									)}
								</CardContent>
							</motion.div>
						))}
					</div>
				</CardContent>
			</Card>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('dialog.title')}</DialogTitle>
					</DialogHeader>
					<DialogDescription>
						<p>{t('dialog.description')}</p>
					</DialogDescription>
					<DialogFooter>
						<Button variant={'outline'} onClick={() => setIsDialogOpen(false)}>
							{t('dialog.close')}
						</Button>
						<Button
							variant={'outline'}
							onClick={() => {
								setIsDialogOpen(false)
								navigate('/settings')
								window.location.reload()
							}}
						>
							{t('dialog.go_to_settings')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</motion.div>
	)
}
