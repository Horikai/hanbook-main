import { motion } from 'framer-motion'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaGithub } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { icons } from 'lucide-react'
import { useInView } from '@/hooks/useInView'
import type { RefObject } from 'react'

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.3 },
	},
}

const sectionVariants = {
	hidden: { opacity: 0, y: 50 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5 },
	},
}

const hideVariants = {
	hidden: { opacity: 0, y: -50 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

interface Cards {
	title: string
	description: string
	link: string
	icon: string
}

const cards: Array<Cards> = [
	{
		title: 'search.title',
		description: 'search.description',
		link: '/search.html',
		icon: 'Search',
	},
	{
		title: 'commands.title',
		description: 'commands.description',
		link: '/commands.html',
		icon: 'Terminal',
	},
	{
		title: 'artifacts.title',
		description: 'artifacts.description',
		link: '/artifacts.html',
		icon: 'Gem',
	},
	{
		title: 'player_settings.title',
		description: 'player_settings.description',
		link: '/settings.html',
		icon: 'Settings',
	},
]

export default function Home() {
	const [heroRef, heroInView] = useInView()
	const [cardsRef, cardsInView] = useInView()
	const [openSourceRef, openSourceInView] = useInView()
	const [ctaRef, ctaInView] = useInView()

	const { t } = useTranslation()

	return (
		<motion.main
			className='min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800'
			variants={containerVariants}
			initial='hidden'
			animate='visible'
		>
			<motion.section
				ref={heroRef as RefObject<HTMLElement>}
				variants={hideVariants}
				initial='hidden'
				animate={heroInView ? 'visible' : 'hidden'}
				className={
					'relative py-20 px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex items-center justify-center bg-cover bg-center'
				}
				style={{ backgroundImage: "url('/homepage-bg.png')" }}
			>
				<div className='absolute inset-0 bg-black/75' />
				<div className='relative z-20 max-w-4xl mx-auto'>
					<h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 animate-slide-in-bottom'>
						{t('title')}
					</h1>
					<p className='text-xl sm:text-2xl text-gray-200 mb-8 animate-slide-in-bottom delay-200'>
						{t('description')}
					</p>
					<Button
						size='lg'
						asChild
						className='animate-slide-in-bottom delay-400 bg-white text-black hover:bg-gray-200'
					>
						<a href='/search.html'>{t('features.search.title')}</a>
					</Button>
				</div>
			</motion.section>

			{/* Cards Section */}
			<motion.section
				ref={cardsRef as RefObject<HTMLElement>}
				animate={cardsInView ? 'visible' : 'hidden'}
				className={'py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900'}
				variants={sectionVariants}
			>
				<h2 className='text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white animate-slide-in-bottom'>
					{t('features.title')}
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{cards.map((card, index) => {
						const Icon = icons[card.icon as keyof typeof icons] || icons.FileQuestion
						return (
							<Card
								key={card.link}
								className='flex flex-col animate-slide-in-bottom'
								style={{ animationDelay: `${0.2 * (index + 1)}s` }}
							>
								<CardHeader>
									<div className='flex items-center gap-2'>
										{Icon && <Icon className='h-5 w-5' />}
										<CardTitle>{t(`features.${card.title}`)}</CardTitle>
									</div>
									<CardDescription>{t(`features.${card.description}`)}</CardDescription>
								</CardHeader>
								<CardFooter className='mt-auto'>
									<Button asChild className='w-full'>
										<a href={card.link}>{t('features.access')}</a>
									</Button>
								</CardFooter>
							</Card>
						)
					})}
				</div>
			</motion.section>

			{/* Open Source Section */}
			<motion.section
				ref={openSourceRef as RefObject<HTMLElement>}
				animate={openSourceInView ? 'visible' : 'hidden'}
				className={'bg-gray-100 dark:bg-gray-800 py-16 px-4 sm:px-6 lg:px-8 text-center'}
				variants={sectionVariants}
			>
				<h2 className='text-3xl font-bold mb-4 text-gray-900 dark:text-white animate-slide-in-bottom'>
					{t('open_source.title')}
				</h2>
				<p className='text-xl mb-8 text-gray-600 dark:text-gray-300 animate-slide-in-bottom delay-200'>
					{t('open_source.description')}
				</p>
				<Button size='lg' variant='outline' asChild className='animate-slide-in-bottom delay-400'>
					<a href='/#' target='_blank' rel='noopener noreferrer'>
						<FaGithub className='mr-2 h-5 w-5' /> {t('open_source.button')}
					</a>
				</Button>
			</motion.section>

			{/* Call to Action */}
			<motion.section
				ref={ctaRef as RefObject<HTMLElement>}
				animate={ctaInView ? 'visible' : 'hidden'}
				className={'bg-primary text-primary-foreground py-16 px-4 sm:px-6 lg:px-8 text-center'}
				variants={sectionVariants}
			>
				<h2 className='text-3xl font-bold mb-4 animate-slide-in-bottom'>Support Our Project</h2>
				<p className='text-xl mb-8 animate-slide-in-bottom delay-200' style={{ animationDelay: '0.2s' }}>
					{t('donation.description')}
				</p>
				<Button size='lg' variant='secondary' asChild className='animate-slide-in-bottom delay-400'>
					<a href='/donation.html'>Support Us</a>
				</Button>
			</motion.section>
		</motion.main>
	)
}
