import { Suspense, lazy } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useCookies } from 'react-cookie'
import { useTranslation } from 'react-i18next'
import YuukiPS from '@/api/yuukips'
import ElaXanAPI from '@/api/elaxanApi'
import { Button } from '@/components/ui/button'
import { LoadingContainer } from '@/components/ui/loading'
import type { Description } from '@/types/gm'
import type { CurrentType, State } from './components/types'
import expiresInAMonth from './components/cookieExpires'

// Lazy load components
const Search = lazy(() => import('./components/Search'))
const DataCard = lazy(() => import('./components/DataCard'))
const DataCardSR = lazy(() => import('./components/DataCardSR'))

function App() {
	const { t } = useTranslation()
	const [cookies, setCookie] = useCookies([
		'language',
		'showImage',
		'showCommands',
		'type',
		'code',
		'uid',
		'server',
		'limitsResult',
		'showCommandsSR',
	])
	const [state, setState] = useState<State>({
		mainData: [],
		mainDataSR: [],
		searchTerm: '',
		searchInputValue: '',
		loading: false,
		error: false,
		errorMessage: '',
		listCategory: [],
		currentType: cookies.type || 'Genshin Impact',
		selectedCategory: [],
		showImage: cookies.showImage || true,
		showCommands: cookies.showCommands || true,
		showCommandsSR: cookies.showCommandsSR || true,
		currentLimit: cookies.limitsResult || 100,
		yuukips: null,
		output: [],
		limitsResult: cookies.limitsResult || 100,
		isHandbookLoading: false,
		baseURL: 'https://ps.yuuki.me/api/handbook',
	})
	const currentLanguage: keyof Description = cookies.language || 'EN'

	const loadGI = async () => {
		setState((prevState) => ({
			...prevState,
			loading: true,
			mainData: [],
			mainDataSR: [],
		}))
		try {
			const response = await ElaXanAPI.getHandbook(state.baseURL, 'gi', {
				search: state.searchTerm.split(';;').map((e) => e.trim()),
				limit: state.currentLimit,
				category: state.selectedCategory,
				command: state.showCommands,
				image: state.showImage,
				language: currentLanguage.toLowerCase(),
			})
			setState((prevState) => ({
				...prevState,
				loading: false,
				mainData: response,
			}))
		} catch (error) {
			setState((prevState) => ({
				...prevState,
				error: true,
				loading: false,
				errorMessage: (error as Error).message || t('error_occurred'),
			}))
			if (error instanceof Error) {
				setState((prevState) => ({
					...prevState,
					errorMessage: error.message,
				}))
			}
		}
	}

	const loadSR = async () => {
		setState((prevState) => ({
			...prevState,
			loading: true,
			mainData: [],
			mainDataSR: [],
		}))
		try {
			const response = await ElaXanAPI.getHandbook(state.baseURL, 'sr', {
				search: state.searchTerm.split(',').map((e) => e.trim()),
				limit: state.currentLimit,
				category: state.selectedCategory,
				language: currentLanguage.toLowerCase(),
			})
			setState((prevState) => ({
				...prevState,
				loading: false,
				mainDataSR: response.data,
			}))
		} catch (error) {
			setState((prevState) => ({
				...prevState,
				error: true,
				loading: false,
				errorMessage: (error as Error).message || t('error_occurred'),
			}))
			if (error instanceof Error) {
				setState((prevState) => ({
					...prevState,
					errorMessage: error.message,
				}))
			}
		}
	}

	if (!cookies.limitsResult) {
		setCookie('limitsResult', 300, { expires: expiresInAMonth() })
	}

	useEffect(() => {
		const yuukips = new YuukiPS()
		setState((prevState) => ({
			...prevState,
			yuukips,
		}))
		yuukips.getResponseCommand((response) => {
			setState((prevState) => ({
				...prevState,
				output: [
					...prevState.output,
					t('output.response_command', {
						message: response.message,
						code: response.retcode,
					}),
				],
			}))
		})
	}, [t])

	useEffect(() => {
		const getCategory = async () => {
			try {
				const server: string = cookies.type || 'Genshin Impact'
				const currentType = server.includes('Genshin Impact') ? 'gi' : 'sr'
				const { data } = await ElaXanAPI.getCategoryList(state.baseURL, currentType)
				const response = data || []
				setState((prevState) => ({
					...prevState,
					listCategory: response.map((item) => ({
						label: item,
						value: item,
					})),
				}))
			} catch (e) {
				console.error(e)
			}
		}
		getCategory()
	}, [cookies.type, state.baseURL])

	useEffect(() => {
		if (!cookies.server) return

		const server = cookies.server as string
		const type: CurrentType =
			server.includes('gio') || server.includes('gc')
				? 'Genshin Impact'
				: server.includes('lc')
					? 'Star Rail'
					: 'Genshin Impact'

		setState((prevState) => ({
			...prevState,
			currentType: type || prevState.currentType,
		}))
	}, [cookies.server])

	const noResult = useMemo(() => {
		return (
			!state.loading &&
			(state.currentType === 'Genshin Impact' ? state.mainData : state.mainDataSR).length === 0 &&
			state.searchInputValue !== ''
		)
	}, [state.loading, state.currentType, state.mainData, state.mainDataSR, state.searchInputValue])

	return (
		<div
			className={`container mx-auto flex flex-col justify-between px-4 sm:px-6 lg:px-8 ${
				state.loading && 'cursor-progress'
			}`}
		>
			{/* search function */}
			<div className='mb-8'>
				<Suspense fallback={<LoadingContainer className='h-20' />}>
					<Search
						setState={setState}
						state={state}
						currentLanguage={currentLanguage}
						loadGI={loadGI}
						loadSR={loadSR}
						isHandbookLoading={state.isHandbookLoading}
					/>
				</Suspense>
			</div>
			{/* end search function */}

			{/* Show Data List */}
			{!state.error && (
				<div className='mb-8'>
					<Suspense fallback={<LoadingContainer />}>
						{state.currentType === 'Genshin Impact' ? (
							<DataCard
								code={cookies.code}
								uid={cookies.uid}
								server={cookies.server}
								currentLanguage={currentLanguage}
								stateApp={state}
								setStateApp={setState}
							/>
						) : (
							<DataCardSR
								code={cookies.code}
								uid={cookies.uid}
								server={cookies.server}
								// biome-ignore lint/suspicious/noExplicitAny: <explanation>
								currentLanguage={currentLanguage as any}
								stateApp={state}
								setStateApp={setState}
							/>
						)}
					</Suspense>
				</div>
			)}
			{/* End of Show Data List */}

			{/* Load More Button */}
			{!state.error &&
				state.currentLimit <
					(state.currentType === 'Genshin Impact' ? state.mainData : state.mainDataSR).length && (
					<div className='mb-8 flex justify-center'>
						<Button
							className='w-full bg-primary px-6 py-2 text-primary-foreground transition-colors duration-200 hover:bg-primary/90 sm:w-auto'
							onClick={() => {
								setState((prevState) => ({
									...prevState,
									currentLimit: prevState.currentLimit + 100,
								}))
							}}
						>
							{t('load_more')}
						</Button>
					</div>
				)}
			{/* End of Load More Button */}

			{!state.loading &&
				!noResult &&
				(state.currentType === 'Genshin Impact' ? state.mainData : state.mainDataSR).length === 0 && (
					<div className='my-20 flex items-center justify-center'>
						<div className='text-center'>
							<h1 className='mb-2 text-3xl font-bold'>{t('search_for_something')}</h1>
							<p className='text-muted-foreground'>{t('search_for_item')}</p>
						</div>
					</div>
				)}

			{!state.error && noResult && (
				<div className='my-20 flex items-center justify-center'>
					<div className='text-center'>
						<h1 className='mb-2 text-3xl font-bold'>{t('no_results_found')}</h1>
						<p className='text-muted-foreground'>
							{t('no_results_for_query')}
							<span className='ml-1 font-bold'>{state.searchInputValue}</span>
						</p>
					</div>
				</div>
			)}

			{/* Error */}
			{state.error && !state.loading && (
				<div className='my-20 flex items-center justify-center'>
					<div className='text-center'>
						<h1 className='mb-2 text-3xl font-bold text-destructive'>{t('error_occurred')}</h1>
						<p className='text-muted-foreground'>
							{t('error_message')}
							<span className='ml-1 font-bold'>{state.errorMessage}</span>
						</p>
					</div>
				</div>
			)}

			{/* End of Error */}

			{/* Loading */}
			{state.loading && (
				<div className='flex min-h-[50vh] items-center justify-center'>
					<div className='relative h-24 w-24'>
						<div className='absolute inset-0 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-r-transparent border-t-primary' />
						<div className='animation-delay-150 absolute inset-2 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-r-transparent border-t-secondary' />
						<div className='animation-delay-300 absolute inset-4 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-r-transparent border-t-accent' />
					</div>
				</div>
			)}
			{/* End of Loading */}
			<div className='m-4' />
		</div>
	)
}

export default App
