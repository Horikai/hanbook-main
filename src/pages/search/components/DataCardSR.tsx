import YuukiPS from '@/api/yuukips'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { LoadingContainer } from '@/components/ui/loading'
import type { Command, Data, ImageClass, ListRelicItem } from '@/types/hsr'
import type React from 'react'
import { memo, useCallback, useState, Suspense, lazy, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FaStar } from 'react-icons/fa'
import { MdOutlineContentCopy } from 'react-icons/md'
import { RiSlashCommands2 } from 'react-icons/ri'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import type { State } from './types'
import { useInView } from '@/hooks/useInView'
import { useVirtualization } from '@/hooks/useVirtualization'

// Lazy load components
const Collapse = lazy(() => import('@/components/ui/collapse'))

const defaultImage = 'https://api.elaxan.com/images/genshin-impact/not-found.png'

const convertNumberToText = (num: number): string | undefined => {
	switch (num) {
		case 5:
			return 'bg-rarityFive'
		case 4:
			return 'bg-rarityFour'
		case 3:
			return 'bg-rarityThree'
		default:
			return
	}
}

const getImageSrc = (image: string | ImageClass): string => {
	if (typeof image === 'string') {
		return image
	}
	if (typeof image === 'object' && image.icon) {
		return image.icon
	}
	return defaultImage
}

const ImageComponent: React.FC<{
	item: Data
	currentLanguage: DataCardSRProps['currentLanguage']
}> = memo(({ item, currentLanguage }) => {
	const imageSrc = getImageSrc(item.image || '')

	return (
		<div className='flex-shrink-0'>
			<LazyLoadImage
				src={imageSrc}
				alt={item.name[currentLanguage]}
				className={`w-32 rounded-lg max-sm:ml-3 sm:ml-3 md:ml-0 ${convertNumberToText(item.rarity || 1)}`}
				effect='opacity'
				onError={(e) => {
					e.currentTarget.style.display = 'none'
				}}
			/>
		</div>
	)
})

const initialState = {
	args: [] as string[],
	command: '',
	openModal: false,
}

interface DataCardSRProps {
	currentLanguage: 'en' | 'id' | 'ru' | 'jp' | 'th' | 'chs' | 'cht' | 'fr'
	uid: string
	code: string
	server: string
	stateApp: State
	setStateApp: React.Dispatch<React.SetStateAction<State>>
}

const CommandSection = memo(
	({
		data,
		handleApplyCommand,
		handleCommandCopy,
	}: {
		data: Command
		handleApplyCommand: (value: string) => void
		handleCommandCopy: (command: string) => void
	}) => (
		<div className='rounded-box border-base-300 p-3 sm:p-6'>
			{Object.entries(data).map(([key, value]: [string, Command[keyof Command]]) => (
				<div key={key}>
					<h3 className='text-sm sm:text-base font-bold'>{value?.name}</h3>
					<div className='mt-2 flex items-center justify-between rounded-lg bg-gray-300 p-2 dark:bg-gray-700'>
						<div className='group flex w-full items-center justify-between'>
							<code className='text-xs sm:text-sm break-all sm:break-normal'>{value?.value}</code>
							<div className='flex items-center ml-2'>
								<div className='mr-2 cursor-pointer rounded-lg border-2 border-gray-600 p-1 sm:p-2'>
									<RiSlashCommands2 onClick={() => handleApplyCommand(value?.value || '')} />
								</div>
								<div className='cursor-pointer rounded-lg border-2 border-gray-600 p-1 sm:p-2'>
									<MdOutlineContentCopy onClick={() => handleCommandCopy(value?.value || '')} />
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	)
)

const RelicListSection = memo(
	({
		list,
		currentLanguage,
		handleButtonCopy,
		handleApplyCommand,
		handleCommandCopy,
		showCommand,
	}: {
		list: ListRelicItem[]
		currentLanguage: DataCardSRProps['currentLanguage']
		handleButtonCopy: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
		handleApplyCommand: (value: string) => void
		handleCommandCopy: (command: string) => void
		showCommand: boolean
	}) => {
		const [showCommands, setShowCommands] = useState<{ [key: number]: boolean }>({})
		const { t } = useTranslation('translation', { keyPrefix: 'card' })

		const toggleShowCommand = (id: number) => {
			setShowCommands((prev) => ({
				...prev,
				[id]: !prev[id],
			}))
		}

		return (
			<div className='mt-4'>
				<h2 className='mb-3 text-xl font-semibold text-gray-700 dark:text-gray-300'>{t('relic_items')}</h2>
				<div className='space-y-4'>
					{list.map((relic) => (
						<div key={relic.id} className='rounded-lg bg-slate-200 p-3 sm:p-4 dark:bg-slate-700'>
							<div className='flex flex-col sm:flex-row sm:items-start sm:space-x-4'>
								{relic.image && (
									<div className='mb-3 sm:mb-0 flex-shrink-0'>
										<LazyLoadImage
											src={getImageSrc(relic.image)}
											alt={relic.name[currentLanguage] || ''}
											className={`w-full sm:w-20 rounded-lg ${convertNumberToText(relic.rarity)}`}
											effect='opacity'
											onError={(e) => {
												e.currentTarget.style.display = 'none'
											}}
										/>
									</div>
								)}
								<div className='flex-grow'>
									<div className='flex items-center'>
										<FaStar className='text-yellow-500' />
										<p className='ml-2 font-bold text-yellow-500'>{relic.rarity}</p>
									</div>
									<p className='text-sm sm:text-base text-gray-500 dark:text-gray-400'>{relic.id}</p>
									<h3 className='text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300'>
										{relic.name[currentLanguage.toLowerCase() as keyof typeof relic.name] || ''}
									</h3>
									<div className='mt-2 flex flex-col sm:flex-row gap-2 sm:justify-between'>
										<Button
											className='w-full sm:w-auto rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition duration-300 hover:bg-blue-700'
											value={`${relic.name[currentLanguage] || ''} || ${relic.id}`}
											onClick={handleButtonCopy}
										>
											{t('button.copy_id')}
										</Button>
										<Button
											className='w-full sm:w-auto rounded-lg bg-gray-600 px-3 py-1 text-sm text-white transition duration-300 hover:bg-gray-700'
											onClick={() => toggleShowCommand(relic.id)}
										>
											{t('show_the_commands')}
										</Button>
									</div>
								</div>
							</div>
							<div className='mt-3'>
								{showCommands[relic.id] && showCommand && relic.command && (
									<CommandSection
										data={relic.command}
										handleApplyCommand={handleApplyCommand}
										handleCommandCopy={handleCommandCopy}
									/>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}
)

const CardItem = memo(
	({
		item,
		currentLanguage,
		handleButtonCopy,
		handleApplyCommand,
		handleCommandCopy,
		stateApp,
	}: {
		item: Data
		currentLanguage: DataCardSRProps['currentLanguage']
		handleButtonCopy: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
		handleApplyCommand: (value: string) => void
		handleCommandCopy: (command: string) => void
		stateApp: State
		uid: string
		code: string
		server: string
		setStateApp: React.Dispatch<React.SetStateAction<State>>
	}) => {
		const { t } = useTranslation('translation', { keyPrefix: 'card' })
		const [ref, isInView] = useInView<HTMLDivElement>({
			threshold: 0.1,
			rootMargin: '200px 0px',
		})
		const [hasAnimated, setHasAnimated] = useState(false)

		useEffect(() => {
			if (isInView && !hasAnimated) {
				setHasAnimated(true)
			}
		}, [isInView, hasAnimated])

		if (!isInView && !hasAnimated) {
			return <div ref={ref} style={{ height: '300px' }} />
		}

		return (
			<div
				ref={ref}
				className={`mt-5 flex items-center justify-center ${
					!hasAnimated && isInView ? 'animate-slide-in-bottom' : ''
				} ${isInView || hasAnimated ? 'visible opacity-100' : 'opacity-0'}`}
				style={{
					transition: 'opacity 0.3s ease-out',
				}}
			>
				<div className='w-full rounded-lg bg-slate-300 p-6 shadow-lg dark:bg-slate-800 md:max-w-md lg:max-w-lg xl:max-w-xl'>
					<div className='flex flex-col md:flex-row'>
						{stateApp.showImage && <ImageComponent item={item} currentLanguage={currentLanguage} />}
						<div className='ml-3 flex flex-grow flex-col justify-between'>
							<div>
								{item.rarity && (
									<div className='mb-2 flex items-center'>
										<FaStar className='text-yellow-500' />
										<p className='ml-2 mt-[1px] select-none font-bold text-yellow-500'>
											{item.rarity}
										</p>
									</div>
								)}
								<h1 className='text-2xl font-semibold text-gray-700 dark:text-gray-300'>
									{item.name[currentLanguage.toLowerCase() as keyof typeof item.name]}
									{item.type && (
										<span className='ml-2 text-[1rem] font-bold text-gray-400 dark:text-gray-600'>
											{item.type}
										</span>
									)}
									{item.level && (
										<span className='ml-2 text-[1rem] font-bold text-gray-400 dark:text-gray-600'>
											{t('level_stage', { level: item.level })}
										</span>
									)}
								</h1>
								<p className='font-bold text-gray-400 dark:text-gray-600'>{item.id}</p>
								{item.nextMission && (
									<p className='font-bold text-gray-400 dark:text-gray-600'>
										{t('next_mission', {
											id: item.nextMission,
										})}
									</p>
								)}
								{item.description && (
									<p className='text-gray-500'>
										{
											item.description[
												currentLanguage.toLowerCase() as keyof typeof item.description
											]
										}
									</p>
								)}
							</div>
							<div className='mt-4 flex items-end justify-between md:mt-0'>
								<div className='select-none text-lg font-bold text-gray-800 dark:text-gray-300'>
									{item.category}
								</div>
								<Button
									className='mt-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition duration-300 hover:bg-blue-700'
									value={`${item.name[currentLanguage]} || ${item.id}`}
									onClick={handleButtonCopy}
								>
									{t('button.copy_id')}
								</Button>
							</div>
						</div>
					</div>
					{stateApp.showCommandsSR && item.command && (
						<div className='mt-4 rounded-lg bg-slate-300 p-4 dark:bg-slate-800'>
							<Suspense fallback={<LoadingContainer className='h-20' />}>
								<Collapse title={t('show_the_commands')} className='w-full'>
									<Card className='space-x-2'>
										<CardHeader>
											<CardTitle>{t('title.lc')}</CardTitle>
											<CardDescription>{t('description.lc')}</CardDescription>
										</CardHeader>
										<CardContent>
											<CommandSection
												data={item.command}
												handleApplyCommand={handleApplyCommand}
												handleCommandCopy={handleCommandCopy}
											/>
										</CardContent>
									</Card>
								</Collapse>
							</Suspense>
						</div>
					)}
					{item.list && item.list.length > 0 && (
						<div className='mt-4 rounded-lg bg-slate-300 p-4 dark:bg-slate-800'>
							<Suspense fallback={<LoadingContainer className='h-20' />}>
								<Collapse title={t('show_the_relics')} className='w-full'>
									<RelicListSection
										list={item.list}
										currentLanguage={currentLanguage}
										handleButtonCopy={handleButtonCopy}
										handleApplyCommand={handleApplyCommand}
										handleCommandCopy={handleCommandCopy}
										showCommand={stateApp.showCommandsSR}
									/>
								</Collapse>
							</Suspense>
						</div>
					)}
				</div>
			</div>
		)
	}
)

const DataCardSR: React.FC<DataCardSRProps> = ({ currentLanguage, code, server, uid, setStateApp, stateApp }) => {
	const { t } = useTranslation('translation', { keyPrefix: 'card' })
	const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' })
	const { t: tOutput } = useTranslation('translation', {
		keyPrefix: 'output',
	})
	const { toast } = useToast()
	const [state, setState] = useState<typeof initialState>(initialState)
	const [itemHeight, setItemHeight] = useState(50)

	const { containerHeight, visibleRange } = useVirtualization({
		itemHeight,
		overscan: 5,
		totalItems: stateApp.mainDataSR.slice(0, stateApp.currentLimit).length,
	})

	useEffect(() => {
		const updateItemHeight = () => {
			const width = window.innerWidth
			let newHeight = 300 // default height
			if (width < 640) {
				// sm
				newHeight = 400
			} else if (width < 768) {
				// md
				newHeight = 350
			}
			setItemHeight(newHeight)
		}

		window.addEventListener('resize', updateItemHeight)
		updateItemHeight() // Initial call

		return () => window.removeEventListener('resize', updateItemHeight)
	}, [])

	const visibleData = stateApp.mainDataSR.slice(0, stateApp.currentLimit).slice(visibleRange.start, visibleRange.end)

	const handleButtonCopy = useCallback(
		(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			const { value } = e.currentTarget
			const [name, id] = value.split(' || ')
			navigator.clipboard
				.writeText(id)
				.then(() => {
					toast({
						title: tToast('copied_id.title'),
						description: tToast('copied_id.description', {
							id,
							name,
						}),
					})
				})
				.catch((error) => {
					console.error('Failed to copy:', error)
					toast({
						title: tToast('failed_copy_id.title'),
						description: tToast('failed_copy_id.description'),
						variant: 'destructive',
					})
				})
		},
		[toast, tToast]
	)

	const handleCommandCopy = useCallback(
		(command: string) => {
			navigator.clipboard
				.writeText(command)
				.then(() => {
					toast({
						title: tToast('copied_command.title'),
						description: tToast('copied_command.description', {
							command: command,
						}),
					})
				})
				.catch((error) => {
					console.error('Failed to copy:', error)
					toast({
						title: tToast('failed_copy_command.title'),
						description: tToast('failed_copy_command.description'),
						variant: 'destructive',
					})
				})
		},
		[toast, tToast]
	)

	const handleApplyCommand = useCallback(
		(value: string) => {
			if (!uid || !code || !server) {
				toast({
					title: tToast('apply_command_no_configured.title'),
					description: tToast('apply_command_no_configured.description'),
					action: (
						<ToastAction
							onClick={() => {
								document.location.href = '/settings.html'
							}}
							altText={tToast('apply_command_no_configured.action.text')}
						>
							{tToast('apply_command_no_configured.action.url_text')}
						</ToastAction>
					),
				})
				return
			}
			const formatCommand = YuukiPS.extractFormattedPlaceholders(value)
			setState((prev) => ({
				...prev,
				args: formatCommand,
				command: value,
				openModal: true,
			}))
		},
		[code, server, tToast, toast, uid]
	)

	const handleModalExecute = useCallback(() => {
		if (!stateApp.yuukips) {
			setStateApp((prev) => ({
				...prev,
				output: [...prev.output, tOutput('websocket_not_established')],
			}))
			return
		}
		const userValues = state.args.reduce<Record<string, string>>((obj, arg) => {
			const key = arg.replace(/ /g, '')
			const element = document.getElementById(`data-card-apply-command-args-${key}`) as HTMLInputElement
			if (element && element.value !== '') {
				obj[key] = element.value
			}
			return obj
		}, {})
		const generateCommand = YuukiPS.generateResultCommand(state.command, userValues)
		setStateApp((prev) => ({
			...prev,
			output: [...prev.output, tOutput('executing_command', { command: generateCommand })],
		}))
		stateApp.yuukips.sendCommand(uid, code, server, generateCommand)
	}, [code, server, setStateApp, state.args, state.command, stateApp.yuukips, tOutput, uid])

	return (
		<Suspense fallback={<LoadingContainer />}>
			<div style={{ height: containerHeight, position: 'relative' }}>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						transform: `translateY(${visibleRange.start * itemHeight}px)`,
					}}
				>
					{visibleData.map((item) => (
						<CardItem
							key={`card-sr-${item.id}`}
							item={item}
							currentLanguage={currentLanguage}
							handleButtonCopy={handleButtonCopy}
							handleApplyCommand={handleApplyCommand}
							handleCommandCopy={handleCommandCopy}
							stateApp={stateApp}
							{...{ uid, code, server, setStateApp }}
						/>
					))}
				</div>
			</div>
			{/* TODO: Create new components for apply commands */}
			<Dialog open={state.openModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('dialog.title')}</DialogTitle>
						<DialogDescription>
							<p>
								{state.args.length > 0
									? t('dialog.description.with_values', {
											command: state.command,
											list: state.args.join(', '),
										})
									: t('dialog.description.without_values', {
											command: state.command,
										})}
							</p>
							<p>
								{t('dialog.account', {
									uid: uid,
									server: server,
								})}
							</p>
						</DialogDescription>
					</DialogHeader>
					{state.args.map((arg) => (
						<>
							<Label key={`apply-the-command-args-${arg.replace(/ /, '')}`}>
								<span>{arg}</span>
								<Input
									className='input-bordered w-full'
									id={`data-card-apply-command-args-${arg.replace(/ /, '')}`}
								/>
							</Label>
						</>
					))}
					{stateApp.output.length > 0 && (
						<>
							<div className='output-container mt-5 max-h-[200px] overflow-y-auto bg-slate-950 p-2'>
								{stateApp.output.map((text) => (
									<div
										key={text.replace(/ /g, '')}
										className='text-sm'
										// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
										dangerouslySetInnerHTML={{
											__html: text,
										}}
									/>
								))}
							</div>
							<div className='mt-2 text-sm'>
								<Button
									variant={'ghost'}
									size={'sm'}
									onClick={() => {
										setState((prev) => ({
											...prev,
											output: [],
										}))
									}}
								>
									{t('button.clear_output')}
								</Button>
							</div>
						</>
					)}
					<div className='flex justify-end gap-2'>
						<Button className='mt-3' onClick={handleModalExecute}>
							{t('button.apply_command')}
						</Button>
						<Button
							className='mt-3'
							variant={'secondary'}
							onClick={() =>
								setState((prev) => ({
									...prev,
									openModal: false,
								}))
							}
						>
							{t('button.close')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</Suspense>
	)
}

export default memo(DataCardSR)
