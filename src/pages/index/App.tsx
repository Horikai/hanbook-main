import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaGithub } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { icons } from 'lucide-react'

const cards = [
	{
		title: 'search.title',
		description: 'search.description',
		link: '/search',
		icon: 'Search',
	},
	{
		title: 'commands.title',
		description: 'commands.description',
		link: '/commands',
		icon: 'Terminal',
	},
	{
		title: 'artifacts.title',
		description: 'artifacts.description',
		link: '/artifacts',
		icon: 'Gem',
	},
	{
		title: 'player_settings.title',
		description: 'player_settings.description',
		link: '/settings',
		icon: 'Settings',
	},
]

export default function Home() {
	const { t } = useTranslation()
	return (
		<main className='min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800'>
			<section
				className='relative py-20 px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex items-center justify-center bg-cover bg-center'
				style={{ backgroundImage: "url('/homepage-bg.png')" }}
			>
				<div className='absolute inset-0 bg-gradient-to-b from-black/70 to-black/40' />
				<div className='relative z-10'>
					<h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4'>{t('title')}</h1>
					<p className='text-xl sm:text-2xl text-gray-200 mb-8'>{t('description')}</p>
					<Button size='lg' asChild>
						<a href='/search'>{t('features.search.title')}</a>
					</Button>
				</div>
			</section>

			{/* Cards Section */}
			<section className='py-16 px-4 sm:px-6 lg:px-8'>
				<h2 className='text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white'>
					{t('features.title')}
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{cards.map((card) => {
						const Icon = icons[card.icon as keyof typeof icons] || icons.FileQuestion
						return (
							<Card key={card.link} className='flex flex-col'>
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
			</section>

			{/* Open Source Section */}
			<section className='bg-gray-100 dark:bg-gray-800 py-16 px-4 sm:px-6 lg:px-8 text-center'>
				<h2 className='text-3xl font-bold mb-4 text-gray-900 dark:text-white'>{t('open_source.title')}</h2>
				<p className='text-xl mb-8 text-gray-600 dark:text-gray-300'>{t('open_source.description')}</p>
				<Button size='lg' variant='outline' asChild>
					<a href='https://github.com/YuukiPS/Handbook' target='_blank' rel='noopener noreferrer'>
						<FaGithub className='mr-2 h-5 w-5' /> {t('open_source.button')}
					</a>
				</Button>
			</section>

			{/* Call to Action */}
			<section className='bg-primary text-primary-foreground py-16 px-4 sm:px-6 lg:px-8 text-center'>
				<h2 className='text-3xl font-bold mb-4'>Support Our Project</h2>
				<p className='text-xl mb-8'>{t('donation.description')}</p>
				<Button size='lg' variant='secondary' asChild>
					<a href='/donation'>Support Us</a>
				</Button>
			</section>
		</main>
	)
}
