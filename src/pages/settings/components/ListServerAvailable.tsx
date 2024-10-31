import { lazy, Suspense, memo, useMemo, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import type { Server } from '@/types/yuukipsServer'
import { useTranslation } from 'react-i18next'
import { IoMdSearch } from 'react-icons/io'
import { LuDot } from 'react-icons/lu'
import { LoadingContainer } from '@/components/ui/loading'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import React from 'react'

// Lazy load the dialog component
const ServerDialog = lazy(() => import('./ServerDialog'))

interface ListServerAvailableProps {
	handleSelectAccount: (value: string) => void
	listServerAvailable: Server
}

const ForwardedTooltipTrigger = memo(
	React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children, ...props }, ref) => (
		<TooltipTrigger {...props} ref={ref as React.LegacyRef<HTMLButtonElement>} asChild>
			{children}
		</TooltipTrigger>
	))
)

const ListServerAvailable: React.FC<ListServerAvailableProps> = memo(({ handleSelectAccount, listServerAvailable }) => {
	const { t } = useTranslation('translation', {
		keyPrefix: 'list_server_available',
	})
	const { toast } = useToast()
	const [search, setSearch] = useState('')
	const [openModal, setOpenModal] = useState<boolean>(false)
	const [uid, setUid] = useState<string>('')
	const [serverSelected, setServerSelected] = useState<string>('')

	const handleSave = useCallback(() => {
		if (!uid) {
			toast({
				title: t('toast.title'),
				description: t('toast.description'),
				variant: 'destructive',
			})
			return
		}
		handleSelectAccount(`${serverSelected}|${uid}`)
		setOpenModal(false)
	}, [handleSelectAccount, serverSelected, uid, t, toast])

	const filteredListServerAvailable = useMemo(
		() =>
			listServerAvailable.data.filter(
				(server) =>
					server.id && !server.server.disable && server.name.toLowerCase().includes(search.toLowerCase())
			),
		[listServerAvailable, search]
	)

	const handleInputUID = (value: string) => {
		const numberValue = value.replace(/\D/g, '')
		setUid(numberValue)
	}

	const handleClickServerList = (value: string) => {
		setServerSelected(value)
		setOpenModal(true)
	}

	return (
		<>
			<div className='mt-2 flex flex-col items-center gap-y-4 text-left text-sm'>
				<Label>{t('label')}</Label>
				<DropdownMenu>
					<DropdownMenuTrigger asChild className='w-full'>
						<Button variant={'outline'}>{t('button')}</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel className='flex justify-center'>{t('select_server')}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<div className='relative my-2 flex items-center justify-center gap-x-2'>
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								type='text'
								placeholder={t('search_placeholder')}
								className='pl-10'
								onKeyDown={(e) => e.stopPropagation()}
							/>
							<div className='absolute left-3'>
								<IoMdSearch className='text-xl' />
							</div>
						</div>
						<DropdownMenuRadioGroup onValueChange={handleClickServerList} className='w-96'>
							<ScrollArea
								className='h-72 w-full rounded-md border'
								key={`list-server-available-${listServerAvailable.data.length}`}
							>
								{filteredListServerAvailable.map((server, index) => (
									<React.Fragment key={`available-server-fragment-${server.id}`}>
										{index !== 0 && <Separator key={`available-server-separator-${server.id}`} />}
										<DropdownMenuRadioItem
											value={`${server.name}|${server.id}`}
											key={`available-server-${server.id}`}
											className='cursor-pointer'
										>
											<TooltipProvider delayDuration={300}>
												<Tooltip>
													<ForwardedTooltipTrigger>
														<span>
															<LuDot
																className={`text-4xl ${
																	server.server.online
																		? 'text-green-500'
																		: 'text-red-500'
																}`}
															/>
														</span>
													</ForwardedTooltipTrigger>
													<TooltipContent>
														<p>
															{server.server.online
																? t('tooltip.online')
																: t('tooltip.offline')}
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											{server.name}
										</DropdownMenuRadioItem>
									</React.Fragment>
								))}
							</ScrollArea>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Suspense fallback={<LoadingContainer className='h-24' />}>
				{openModal && (
					<ServerDialog
						open={openModal}
						onClose={() => setOpenModal(false)}
						uid={uid}
						onUidChange={handleInputUID}
						onSave={handleSave}
					/>
				)}
			</Suspense>
		</>
	)
})

export default ListServerAvailable
