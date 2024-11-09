import type { Dispatch, SetStateAction } from 'react'
import { motion } from 'framer-motion'

interface TabsProps {
	activeTab: number
	setActiveTab: Dispatch<SetStateAction<number>>
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
	const listTabs = ['GC', 'GIO', 'LC']

	return (
		<motion.div
			className='flex flex-wrap sm:flex-nowrap border-b border-gray-200 dark:border-gray-700'
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			{listTabs.map((tab, index) => (
				<motion.button
					key={`tab-${tab}`}
					type='button'
					onClick={() => setActiveTab(index)}
					className={`${
						activeTab === index
							? 'border-blue-500 text-blue-600 dark:text-blue-400'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
					}
						flex-1 sm:flex-none px-4 py-2 text-sm font-medium 
						border-b-2 transition-colors duration-200
						focus:outline-none whitespace-nowrap
						`}
				>
					{tab}
				</motion.button>
			))}
		</motion.div>
	)
}
export default Tabs
